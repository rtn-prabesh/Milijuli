"use client";

import React, { useState, useMemo } from "react";
import { 
  HandCoins, PlusCircle, Sparkles, Loader2, AlertCircle, 
  ArrowUpRight, ArrowDownLeft, FileText, Calendar, Percent, 
  Clock, DollarSign, Receipt, CreditCard, ChevronRight 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore, Loan } from "@/store/useAppStore";
import { uploadProofFile } from "@/utils/storage";
import TransactionStream from "@/components/TransactionStream";
import Sheet from "@/components/ui/Sheet";
import ProofImage from "@/components/ui/ProofImage";

export default function Loans() {
  const { profile } = useAuth();
  
  // Zustand store properties
  const loans = useAppStore((state) => state.loans);
  const payments = useAppStore((state) => state.payments);
  const profiles = useAppStore((state) => state.profiles);
  const addLoan = useAppStore((state) => state.addLoan);
  const addPayment = useAppStore((state) => state.addPayment);
  const storeError = useAppStore((state) => state.error);
  const clearStoreError = useAppStore((state) => state.clearError);

  // Tab State
  const [activeTab, setActiveTab] = useState<"active" | "repayments" | "paid">("active");

  // Local Form state - Loan Issuance
  const [isLoanSheetOpen, setIsLoanSheetOpen] = useState(false);
  const [borrowerId, setBorrowerId] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [interestRate, setInterestRate] = useState("12"); // default 12%
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [loanReceipt, setLoanReceipt] = useState("");
  const [loanNote, setLoanNote] = useState("");
  const [loanProof, setLoanProof] = useState<File | null>(null);

  // Local Form state - Repayment
  const [isRepaySheetOpen, setIsRepaySheetOpen] = useState(false);
  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState("");
  const [repayDate, setRepayDate] = useState(new Date().toISOString().split("T")[0]);
  const [repayReceipt, setRepayReceipt] = useState("");
  const [repayNote, setRepayNote] = useState("");
  const [repayProof, setRepayProof] = useState<File | null>(null);

  // Loading & Error States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Helper dictionary for looking up profiles
  const profileMap = useMemo(() => {
    const map = new Map<string, typeof profiles[0]>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  // Compute repayments for each loan
  const loanRepaymentsMap = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => {
      const current = map.get(p.loan_id) || 0;
      map.set(p.loan_id, current + p.amount);
    });
    return map;
  }, [payments]);

  // Map loans into calculated categories
  const mappedLoans = useMemo(() => {
    return loans.map((l) => {
      const totalPaid = loanRepaymentsMap.get(l.id) || 0;
      const outstanding = Math.max(0, l.amount - totalPaid);
      const isPaidOff = outstanding <= 0;
      
      // Determine logical status
      let calculatedStatus: "active" | "paid" | "overdue" = "active";
      if (isPaidOff) {
        calculatedStatus = "paid";
      } else if (l.due_date && new Date(l.due_date).getTime() < Date.now()) {
        calculatedStatus = "overdue";
      }

      return {
        ...l,
        totalPaid,
        outstanding,
        calculatedStatus,
      };
    });
  }, [loans, loanRepaymentsMap]);

  // Lists divided by calculated status
  const activeLoans = useMemo(() => {
    return mappedLoans.filter((l) => l.calculatedStatus !== "paid");
  }, [mappedLoans]);

  const paidLoans = useMemo(() => {
    return mappedLoans.filter((l) => l.calculatedStatus === "paid");
  }, [mappedLoans]);

  // Summary Metrics
  const totalOutstandingBalance = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + l.outstanding, 0);
  }, [activeLoans]);

  const activeLoansCount = activeLoans.length;

  const totalEstimatedInterest = useMemo(() => {
    return activeLoans.reduce((sum, l) => {
      const interestFraction = l.interest_rate / 100;
      return sum + (l.outstanding * interestFraction);
    }, 0);
  }, [activeLoans]);

  // Member lists
  const approvedMembers = useMemo(() => {
    return profiles.filter((p) => p.status === "approved");
  }, [profiles]);

  // Open Loan Issuance Sheet
  const handleOpenLoanSheet = () => {
    setBorrowerId(approvedMembers[0]?.id || "");
    setLoanAmount("");
    setInterestRate("12");
    setIssueDate(new Date().toISOString().split("T")[0]);
    // Set due date to default 6 months out
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setDueDate(d.toISOString().split("T")[0]);
    
    const generatedReceipt = `LN-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setLoanReceipt(generatedReceipt);
    setLoanNote("");
    setLoanProof(null);
    setFormError(null);
    clearStoreError();
    setIsLoanSheetOpen(true);
  };

  // Open Repayment Sheet prefilled with loan info
  const handleOpenRepaySheet = (loan: Loan) => {
    setRepayLoan(loan);
    const outstanding = mappedLoans.find((l) => l.id === loan.id)?.outstanding || loan.amount;
    setRepayAmount(outstanding.toString());
    setRepayDate(new Date().toISOString().split("T")[0]);
    const generatedReceipt = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setRepayReceipt(generatedReceipt);
    setRepayNote("");
    setRepayProof(null);
    setFormError(null);
    clearStoreError();
    setIsRepaySheetOpen(true);
  };

  // Handle Loan Form Submit
  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerId) {
      setFormError("Please select a borrower.");
      return;
    }
    const numAmount = parseFloat(loanAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid loan amount.");
      return;
    }
    const numRate = parseFloat(interestRate);
    if (isNaN(numRate) || numRate < 0) {
      setFormError("Please enter a valid interest rate.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    clearStoreError();

    try {
      let uploadedUrl = "";
      if (loanProof) {
        uploadedUrl = await uploadProofFile(loanProof, "loans");
      }

      await addLoan({
        member_id: borrowerId,
        amount: numAmount,
        interest_rate: numRate,
        date_issued: issueDate,
        due_date: dueDate || undefined,
        receipt_number: loanReceipt.trim(),
        status: "active",
        note: loanNote.trim() || undefined,
        proof_url: uploadedUrl || undefined,
        created_by: profile?.id || null,
      });

      setIsLoanSheetOpen(false);
    } catch (err: any) {
      console.error("[LoansPage] Error issuing loan:", err);
      setFormError(err.message || "Failed to record loan. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Repayment Form Submit
  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;

    const numAmount = parseFloat(repayAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid repayment amount.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    clearStoreError();

    try {
      let uploadedUrl = "";
      if (repayProof) {
        uploadedUrl = await uploadProofFile(repayProof, "payments");
      }

      await addPayment({
        loan_id: repayLoan.id,
        amount: numAmount,
        date: repayDate,
        receipt_number: repayReceipt.trim(),
        note: repayNote.trim() || undefined,
        proof_url: uploadedUrl || undefined,
        created_by: profile?.id || null,
      });

      setIsRepaySheetOpen(false);
    } catch (err: any) {
      console.error("[LoansPage] Error saving repayment:", err);
      setFormError(err.message || "Failed to record repayment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency helper
  const formatRupee = (value: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <HandCoins className="w-5.5 h-5.5 text-indigo-400" />
            Loans & Credit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Track issued credits, outstanding repayments, and member balances.</p>
        </div>

        {profile?.role === "admin" && (
          <button
            onClick={handleOpenLoanSheet}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            Issue New Credit Loan
          </button>
        )}
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Outstanding Balance */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Active Debt</span>
            <h3 className="text-xl font-black text-indigo-400">{formatRupee(totalOutstandingBalance)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 relative z-10">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Active Debtors Count */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Borrowers</span>
            <h3 className="text-xl font-black text-slate-100">{activeLoansCount} Members</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 relative z-10">
            <HandCoins className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Expected Interest Income */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Potential Monthly Interest</span>
            <h3 className="text-xl font-black text-slate-100">{formatRupee(totalEstimatedInterest)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 relative z-10">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-slate-900 select-none">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "active"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Active Ledgers ({activeLoans.length})
        </button>
        <button
          onClick={() => setActiveTab("repayments")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "repayments"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Repayments Log
        </button>
        <button
          onClick={() => setActiveTab("paid")}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "paid"
              ? "border-emerald-500 text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          Paid Archives ({paidLoans.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-4">
        {activeTab === "active" && (
          <div className="space-y-4">
            {activeLoans.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass border border-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mx-auto">
                  <HandCoins className="w-5 h-5 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-slate-400">No active loans issued</p>
                <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                  There are currently no active debtor accounts or open balances on the group ledger.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeLoans.map((loan) => {
                  const borrower = profileMap.get(loan.member_id);
                  const progressPercent = Math.min(
                    100,
                    Math.round((loan.totalPaid / loan.amount) * 100)
                  );
                  
                  return (
                    <div 
                      key={loan.id}
                      className="p-5 rounded-2xl glass border border-slate-900/60 relative overflow-hidden flex flex-col justify-between gap-4"
                    >
                      {/* Top section: Borrower details and badge */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-slate-200">
                            {borrower?.full_name || "Unknown Debtor"}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">
                            Receipt: {loan.receipt_number}
                          </span>
                        </div>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${
                          loan.calculatedStatus === "overdue"
                            ? "bg-red-500/10 border-red-500/20 text-red-400 pulse-effect"
                            : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
                        }`}>
                          {loan.calculatedStatus}
                        </span>
                      </div>

                      {/* Financial info */}
                      <div className="grid grid-cols-3 gap-2 py-2 text-center border-y border-slate-900/60">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Principal</span>
                          <span className="text-xs text-slate-300 font-bold block mt-0.5">{formatRupee(loan.amount)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Interest</span>
                          <span className="text-xs text-indigo-400 font-bold block mt-0.5">{loan.interest_rate}%</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Remaining</span>
                          <span className="text-xs text-emerald-400 font-bold block mt-0.5">{formatRupee(loan.outstanding)}</span>
                        </div>
                      </div>

                      {/* Repayment Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500">
                          <span>Progress Tracker</span>
                          <span>{progressPercent}% Paid</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Date & Note details */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500">
                        <span>Issued: {new Date(loan.date_issued).toLocaleDateString()}</span>
                        {loan.due_date && <span>Due: {new Date(loan.due_date).toLocaleDateString()}</span>}
                      </div>

                      {/* Quick Admin Actions */}
                      {profile?.role === "admin" && (
                        <div className="pt-2 border-t border-slate-900/60 flex gap-2">
                          <button
                            onClick={() => handleOpenRepaySheet(loan)}
                            className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-lg text-[10px] uppercase tracking-wider shadow transition-all transform active:scale-95 cursor-pointer"
                          >
                            Record Repayment
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "repayments" && (
          <div className="space-y-4">
            <TransactionStream typeLock="payments" />
          </div>
        )}

        {activeTab === "paid" && (
          <div className="space-y-4">
            {paidLoans.length === 0 ? (
              <div className="p-12 text-center rounded-2xl glass border border-slate-900/60 space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-400">No settled balances</p>
                <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
                  There are no paid or completely settled credit files recorded in the archives yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paidLoans.map((loan) => {
                  const borrower = profileMap.get(loan.member_id);
                  return (
                    <div 
                      key={loan.id}
                      className="p-5 rounded-2xl glass border border-slate-900/60 relative overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-slate-200">
                            {borrower?.full_name || "Unknown Member"}
                          </h4>
                          <span className="text-[9px] text-slate-500 font-bold block mt-0.5 uppercase tracking-wider">
                            Receipt: {loan.receipt_number}
                          </span>
                        </div>
                        <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-full">
                          Settled
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-2 mt-4 text-center border-y border-slate-900/60">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Settled Principal</span>
                          <span className="text-xs text-slate-300 font-bold block mt-0.5">{formatRupee(loan.amount)}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Settled Repayment</span>
                          <span className="text-xs text-emerald-400 font-bold block mt-0.5">{formatRupee(loan.totalPaid)}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 mt-4">
                        <span>Issued: {new Date(loan.date_issued).toLocaleDateString()}</span>
                        <span>Settled Logs Ok</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer: Issue New Loan Form */}
      <Sheet
        isOpen={isLoanSheetOpen}
        onClose={() => !submitting && setIsLoanSheetOpen(false)}
        title="Issue Credit Loan"
      >
        <form onSubmit={handleLoanSubmit} className="space-y-5">
          {/* Member Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Select Debtor Member</label>
            <select
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              required
              disabled={submitting}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {approvedMembers.length === 0 ? (
                <option value="">No approved members found</option>
              ) : (
                approvedMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.phone_number || "No Phone"})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Loan Principal */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Principal Amount (Rs.)</label>
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="e.g. 50000"
                required
                min="1"
                step="any"
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
              />
            </div>

            {/* Interest Rate */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Interest Rate (% p.a.)</label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="e.g. 12"
                required
                min="0"
                step="0.01"
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Issue Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Issue Date</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Receipt Slip Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Slip / Receipt Number</label>
            <input
              type="text"
              value={loanReceipt}
              onChange={(e) => setLoanReceipt(e.target.value)}
              placeholder="e.g. LN-XXXXXX"
              required
              disabled={submitting}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
            />
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Auditor's Notes</label>
            <textarea
              value={loanNote}
              onChange={(e) => setLoanNote(e.target.value)}
              placeholder="Describe terms, guarantor detail, or collateral info..."
              rows={3}
              disabled={submitting}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none resize-none selectable"
            />
          </div>

          {/* Image Proof Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Lending Agreement / Voucher Upload</label>
            <input
              type="file"
              accept="image/*"
              disabled={submitting}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setLoanProof(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-slate-900 file:text-slate-300 hover:file:bg-slate-800 file:transition-colors file:cursor-pointer cursor-pointer border border-dashed border-slate-900 p-2.5 rounded-xl bg-slate-950/20"
            />
            {loanProof && (
              <p className="text-[10px] text-emerald-400 font-medium">
                Selected file: {loanProof.name} ({(loanProof.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          {/* Errors display */}
          {(formError || storeError) && (
            <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2.5 text-xs text-red-400 select-text">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Execution Error</p>
                <p className="text-[10px] mt-0.5 leading-relaxed">{formError || storeError}</p>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLoanSheetOpen(false)}
              disabled={submitting}
              className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Issuing Credit...
                </>
              ) : (
                "Issue Loan"
              )}
            </button>
          </div>
        </form>
      </Sheet>

      {/* Drawer: Record Repayment Form */}
      <Sheet
        isOpen={isRepaySheetOpen}
        onClose={() => !submitting && setIsRepaySheetOpen(false)}
        title="Record Repayment Entry"
      >
        {repayLoan && (
          <form onSubmit={handleRepaySubmit} className="space-y-5">
            {/* Prefilled Summary info */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-xl space-y-1">
              <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold block">Paying active loan for</span>
              <span className="text-xs font-bold text-slate-200 block">
                {profileMap.get(repayLoan.member_id)?.full_name || "Unknown Member"}
              </span>
              <div className="flex gap-4 mt-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Original principal:</span>{" "}
                  <span className="font-bold text-slate-300">{formatRupee(repayLoan.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Remaining outstanding:</span>{" "}
                  <span className="font-bold text-emerald-400">
                    {formatRupee(
                      mappedLoans.find((l) => l.id === repayLoan.id)?.outstanding || repayLoan.amount
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Repayment Amount */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Repayment Amount (Rs.)</label>
              <input
                type="number"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="e.g. 5000"
                required
                min="1"
                step="any"
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Repayment Date</label>
              <input
                type="date"
                value={repayDate}
                onChange={(e) => setRepayDate(e.target.value)}
                required
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Receipt Number */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Receipt Number</label>
              <input
                type="text"
                value={repayReceipt}
                onChange={(e) => setRepayReceipt(e.target.value)}
                placeholder="e.g. PAY-XXXXXX"
                required
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
              />
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Internal Notes</label>
              <textarea
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                placeholder="Describe details e.g. Cash payment, check clearing, bank transfer slip..."
                rows={3}
                disabled={submitting}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none resize-none selectable"
              />
            </div>

            {/* Proof Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Payment Voucher / Slip Proof Upload</label>
              <input
                type="file"
                accept="image/*"
                disabled={submitting}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setRepayProof(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-slate-900 file:text-slate-300 hover:file:bg-slate-800 file:transition-colors file:cursor-pointer cursor-pointer border border-dashed border-slate-900 p-2.5 rounded-xl bg-slate-950/20"
            />
            {repayProof && (
              <p className="text-[10px] text-emerald-400 font-medium">
                Selected file: {repayProof.name} ({(repayProof.size / 1024).toFixed(1)} KB)
              </p>
            )}
            </div>

            {/* Errors */}
            {(formError || storeError) && (
              <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-xl flex items-start gap-2.5 text-xs text-red-400 select-text">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Execution Error</p>
                  <p className="text-[10px] mt-0.5 leading-relaxed">{formError || storeError}</p>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRepaySheetOpen(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer select-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer select-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording Repayment...
                  </>
                ) : (
                  "Record Payment"
                )}
              </button>
            </div>
          </form>
        )}
      </Sheet>
    </div>
  );
}
