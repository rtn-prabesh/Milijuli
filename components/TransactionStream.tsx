"use client";

import React, { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { 
  Search, Filter, PiggyBank, HandCoins, Receipt, 
  ArrowUpRight, ArrowDownLeft, FileText, Image as ImageIcon,
  User, Calendar, Clock, CheckCircle2, ChevronRight, X 
} from "lucide-react";
import ProofImage from "@/components/ui/ProofImage";
import Sheet from "@/components/ui/Sheet";

interface TransactionStreamProps {
  memberIdFilter?: string; // Optional: Lock to a specific member
  typeLock?: "all" | "savings" | "loans" | "payments"; // Optional: Lock to a specific transaction type
  limit?: number; // Optional: Limit number of displayed rows
  hideFilters?: boolean; // Optional: Hide search/filters UI
}

export interface CombinedTransaction {
  id: string;
  type: "savings" | "loan" | "payment";
  member_id: string | null;
  amount: number;
  date: string;
  receipt_number: string;
  note?: string;
  proof_url?: string;
  created_by?: string | null;
  created_at: string;
  isOptimistic?: boolean;
  
  // Custom extra field for payments
  loan_id?: string;
}

export default function TransactionStream({
  memberIdFilter,
  typeLock = "all",
  limit,
  hideFilters = false,
}: TransactionStreamProps) {
  // Zustand collections
  const profiles = useAppStore((state) => state.profiles);
  const savings = useAppStore((state) => state.savings);
  const loans = useAppStore((state) => state.loans);
  const payments = useAppStore((state) => state.payments);
  const loading = useAppStore((state) => state.loading);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "savings" | "loans" | "payments">(typeLock);
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [selectedTx, setSelectedTx] = useState<CombinedTransaction | null>(null);

  // Map profile dictionary for O(1) lookups
  const profileMap = useMemo(() => {
    const map = new Map<string, typeof profiles[0]>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  // Combine and map savings, loans, payments
  const combinedTransactions = useMemo(() => {
    const txs: CombinedTransaction[] = [];

    // 1. Savings
    if (typeLock === "all" || typeLock === "savings") {
      savings.forEach((s) => {
        txs.push({
          id: s.id,
          type: "savings",
          member_id: s.member_id,
          amount: s.amount,
          date: s.date,
          receipt_number: s.receipt_number,
          note: s.note,
          proof_url: s.proof_url,
          created_by: s.created_by,
          created_at: s.created_at,
          isOptimistic: s.isOptimistic,
        });
      });
    }

    // 2. Loans
    if (typeLock === "all" || typeLock === "loans") {
      loans.forEach((l) => {
        txs.push({
          id: l.id,
          type: "loan",
          member_id: l.member_id,
          amount: l.amount,
          date: l.date_issued,
          receipt_number: l.receipt_number,
          note: l.note,
          proof_url: l.proof_url,
          created_by: l.created_by,
          created_at: l.created_at,
          isOptimistic: l.isOptimistic,
        });
      });
    }

    // 3. Payments
    if (typeLock === "all" || typeLock === "payments") {
      payments.forEach((p) => {
        // Look up corresponding loan to find debtor's profile ID
        const loan = loans.find((l) => l.id === p.loan_id);
        txs.push({
          id: p.id,
          type: "payment",
          member_id: loan ? loan.member_id : null,
          amount: p.amount,
          date: p.date,
          receipt_number: p.receipt_number,
          note: p.note,
          proof_url: p.proof_url,
          created_by: p.created_by,
          created_at: p.created_at,
          isOptimistic: p.isOptimistic,
          loan_id: p.loan_id,
        });
      });
    }

    // Sort chronologically (date descending, then created_at descending)
    return txs.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [savings, loans, payments, typeLock]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return combinedTransactions.filter((tx) => {
      // 1. Member Lock Filter (prop overrides input state)
      const targetMemberId = memberIdFilter || (selectedMember !== "all" ? selectedMember : null);
      if (targetMemberId && tx.member_id !== targetMemberId) {
        return false;
      }

      // 2. Type Filter (if not locked by prop)
      if (typeLock === "all" && typeFilter !== "all" && tx.type !== typeFilter) {
        return false;
      }

      // 3. Search Term Match
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const receiptMatch = tx.receipt_number.toLowerCase().includes(query);
        const noteMatch = tx.note?.toLowerCase().includes(query) || false;
        
        // Match member name
        let nameMatch = false;
        if (tx.member_id) {
          const m = profileMap.get(tx.member_id);
          if (m?.full_name.toLowerCase().includes(query)) {
            nameMatch = true;
          }
        }
        
        if (!receiptMatch && !noteMatch && !nameMatch) {
          return false;
        }
      }

      return true;
    });
  }, [combinedTransactions, memberIdFilter, selectedMember, typeFilter, typeLock, searchTerm, profileMap]);

  // Paginate or limit
  const visibleTransactions = useMemo(() => {
    if (limit && limit > 0) {
      return filteredTransactions.slice(0, limit);
    }
    return filteredTransactions;
  }, [filteredTransactions, limit]);

  // Format currency helper (Nepali Rupees)
  const formatRupee = (value: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Transaction row renderer meta maps
  const getTypeMeta = (type: CombinedTransaction["type"]) => {
    switch (type) {
      case "savings":
        return {
          label: "Savings Deposit",
          icon: PiggyBank,
          colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          amountClass: "text-emerald-400 font-bold",
          prefix: "+",
        };
      case "loan":
        return {
          label: "Lending Loan",
          icon: HandCoins,
          colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          amountClass: "text-indigo-400 font-bold",
          prefix: "",
        };
      case "payment":
        return {
          label: "Loan Repayment",
          icon: Receipt,
          colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          amountClass: "text-amber-400 font-bold",
          prefix: "-",
        };
    }
  };

  // Member names list for filter dropdown
  const approvedMembersList = useMemo(() => {
    return profiles.filter((p) => p.status === "approved");
  }, [profiles]);

  const isTxListLoading = loading.savings || loading.loans || loading.payments;

  return (
    <div className="space-y-4">
      {/* Search & Filters Controls */}
      {!hideFilters && (
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Term Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member, receipt, or notes..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 rounded-xl border border-slate-900 focus:outline-none focus:border-slate-800 text-xs text-slate-300 placeholder-slate-600 transition-colors selectable"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {/* Type Selector (only shown if typeLock is all) */}
            {typeLock === "all" && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-400 font-semibold focus:outline-none cursor-pointer select-none"
              >
                <option value="all">All Types</option>
                <option value="savings">Savings Only</option>
                <option value="loans">Loans Only</option>
                <option value="payments">Repayments Only</option>
              </select>
            )}

            {/* Member Selector (only shown if memberIdFilter is not specified) */}
            {!memberIdFilter && (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="px-3 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-400 font-semibold focus:outline-none cursor-pointer max-w-[150px] md:max-w-xs select-none"
              >
                <option value="all">All Members</option>
                {approvedMembersList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="rounded-2xl glass border border-slate-900/60 overflow-hidden shadow-lg">
        {isTxListLoading && visibleTransactions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 animate-spin text-emerald-400" />
            Synchronizing audit database...
          </div>
        ) : visibleTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">No transactions recorded</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-xs mx-auto">
                No matching financial logs found in the ledger for the specified search criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-900/60">
            {visibleTransactions.map((tx) => {
              const meta = getTypeMeta(tx.type);
              const Icon = meta.icon;
              const member = tx.member_id ? profileMap.get(tx.member_id) : null;

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className={`p-4 hover:bg-slate-900/25 active:bg-slate-900/40 cursor-pointer flex items-center justify-between gap-4 transition-all ${
                    tx.isOptimistic ? "opacity-60 border-l-2 border-l-amber-500/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon indicating type */}
                    <div className={`w-10 h-10 rounded-xl border shrink-0 flex items-center justify-center ${meta.colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Member and note details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 block truncate">
                          {member ? member.full_name : "General System"}
                        </span>
                        {tx.isOptimistic && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold uppercase tracking-widest scale-90">
                            Syncing
                          </span>
                        )}
                        {tx.proof_url && (
                          <span className="text-slate-500 shrink-0" title="Receipt Attached">
                            <ImageIcon className="w-3 Cw-3 text-slate-600 hover:text-emerald-400 transition-colors" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block truncate mt-0.5">
                        {tx.receipt_number} • {tx.note || "No note recorded"}
                      </span>
                    </div>
                  </div>

                  {/* Financial amount */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className={`text-xs ${meta.amountClass}`}>
                        {meta.prefix}
                        {formatRupee(tx.amount)}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-0.5">
                        {new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Details Sheet (opens slide-up on clicking a row) */}
      <Sheet
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title="Ledger Entry Details"
      >
        {selectedTx && (
          <div className="space-y-6">
            {/* Top Stat Summary */}
            <div className="text-center p-6 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2 relative overflow-hidden">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${getTypeMeta(selectedTx.type).colorClass}`}>
                {getTypeMeta(selectedTx.type).label}
              </span>
              
              <h2 className={`text-2xl font-black mt-2 tracking-tight ${getTypeMeta(selectedTx.type).amountClass}`}>
                {getTypeMeta(selectedTx.type).prefix}
                {formatRupee(selectedTx.amount)}
              </h2>

              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Receipt: {selectedTx.receipt_number}
              </p>

              {selectedTx.isOptimistic && (
                <div className="absolute top-2 right-2 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest pulse-effect">
                  Optimistic Sync
                </div>
              )}
            </div>

            {/* Information Grid */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction Ledger Meta</h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                {/* Member */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Debtor/Depositor
                  </span>
                  <span className="font-bold text-slate-200 block truncate">
                    {selectedTx.member_id ? profileMap.get(selectedTx.member_id)?.full_name : "General Group"}
                  </span>
                </div>

                {/* Date */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Effective Date
                  </span>
                  <span className="font-bold text-slate-200 block">
                    {new Date(selectedTx.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Recorded By */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Auditor/Admin
                  </span>
                  <span className="font-bold text-slate-200 block truncate">
                    {selectedTx.created_by ? profileMap.get(selectedTx.created_by)?.full_name : "Auto Ingest"}
                  </span>
                </div>

                {/* Entry Timestamp */}
                <div className="p-3 bg-slate-900/30 border border-slate-900 rounded-xl space-y-1">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Sync Timestamp
                  </span>
                  <span className="font-bold text-slate-200 block">
                    {new Date(selectedTx.created_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} • {new Date(selectedTx.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="p-4 bg-slate-900/20 border border-slate-900 rounded-xl text-xs space-y-1 select-text">
                <span className="text-slate-500 block">Auditor's Notes</span>
                <p className="font-medium text-slate-300 leading-relaxed italic">
                  "{selectedTx.note || "No memo attachments logged with this ledger receipt."}"
                </p>
              </div>
            </div>

            {/* Proof Attachment */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Proof Document</h4>
              <ProofImage proofPath={selectedTx.proof_url} className="w-full h-56 rounded-xl object-contain bg-slate-950 border border-slate-900" />
            </div>

            {/* Actions */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close Drawer View
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
