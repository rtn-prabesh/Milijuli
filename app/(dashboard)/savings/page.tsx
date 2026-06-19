"use client";

import React, { useState, useMemo } from "react";
import { PiggyBank, PlusCircle, Sparkles, Loader2, AlertCircle, ArrowUpRight, DollarSign } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import { uploadProofFile } from "@/utils/storage";
import TransactionStream from "@/components/TransactionStream";
import Sheet from "@/components/ui/Sheet";

export default function Savings() {
  const { profile } = useAuth();
  
  // Zustand store properties
  const savings = useAppStore((state) => state.savings);
  const profiles = useAppStore((state) => state.profiles);
  const addSaving = useAppStore((state) => state.addSaving);
  const storeError = useAppStore((state) => state.error);
  const clearStoreError = useAppStore((state) => state.clearError);

  // Local state for the deposit sheet form
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptNumber, setReceiptNumber] = useState("");
  const [note, setNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Compute stats
  const totalGroupSavings = useMemo(() => {
    return savings.reduce((sum, item) => sum + item.amount, 0);
  }, [savings]);

  const mySavingsTotal = useMemo(() => {
    if (!profile) return 0;
    return savings
      .filter((s) => s.member_id === profile.id)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [savings, profile]);

  const depositCount = savings.length;

  // Filter approved members for selection dropdown
  const approvedMembers = useMemo(() => {
    return profiles.filter((p) => p.status === "approved");
  }, [profiles]);

  // Open sheet and pre-populate fields
  const handleOpenSheet = () => {
    setMemberId(approvedMembers[0]?.id || "");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    // Generate unique random receipt number
    const generatedReceipt = `SAV-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setReceiptNumber(generatedReceipt);
    setNote("");
    setProofFile(null);
    setFormError(null);
    clearStoreError();
    setIsSheetOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      setFormError("Please select a member.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError("Please enter a valid amount greater than 0.");
      return;
    }
    if (!receiptNumber.trim()) {
      setFormError("Please enter a receipt number.");
      return;
    }

    setUploading(true);
    setFormError(null);
    clearStoreError();

    try {
      let uploadedUrl = "";
      if (proofFile) {
        uploadedUrl = await uploadProofFile(proofFile, "savings");
      }

      await addSaving({
        member_id: memberId,
        amount: numAmount,
        date: date,
        receipt_number: receiptNumber.trim(),
        note: note.trim() || undefined,
        proof_url: uploadedUrl || undefined,
        created_by: profile?.id || null,
      });

      // Reset and close
      setIsSheetOpen(false);
    } catch (err: any) {
      console.error("[SavingsPage] Error saving deposit:", err);
      setFormError(err.message || "Failed to record savings deposit. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Format currency helper (Nepali Rupees)
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
            <PiggyBank className="w-5.5 h-5.5 text-emerald-400" />
            Savings Stream Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Audit log of all member deposits and group-wide aggregates.</p>
        </div>

        {profile?.role === "admin" && (
          <button
            onClick={handleOpenSheet}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 cursor-pointer select-none"
          >
            <PlusCircle className="w-4 h-4" />
            Record Member Savings
          </button>
        )}
      </div>

      {/* Stats Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Group Savings */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Group Total Fund</span>
            <h3 className="text-xl font-black text-slate-100">{formatRupee(totalGroupSavings)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 relative z-10">
            <PiggyBank className="w-5 h-5" />
          </div>
        </div>

        {/* My Personal Savings */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">My Total Savings</span>
            <h3 className="text-xl font-black text-emerald-400">{formatRupee(mySavingsTotal)}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 relative z-10">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        {/* Deposits Count */}
        <div className="p-5 rounded-2xl glass border border-slate-900/60 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="space-y-1 relative z-10">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Deposits Logged</span>
            <h3 className="text-xl font-black text-slate-100">{depositCount} Records</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 relative z-10">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Audit Log section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Chronological Audit Log</h2>
          <p className="text-[10px] text-slate-500 mt-0.5">Real-time ledger updates reflecting in-memory Zustand collections.</p>
        </div>

        {/* Combined Transaction List filtered to savings */}
        <TransactionStream typeLock="savings" />
      </div>

      {/* Slide up entry drawer */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => !uploading && setIsSheetOpen(false)}
        title="Record Savings Deposit"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Member Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Select Member</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              required
              disabled={uploading}
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
            {/* Amount input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Deposit Amount (Rs.)</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  min="1"
                  step="any"
                  disabled={uploading}
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
                />
              </div>
            </div>

            {/* Date input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Effective Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={uploading}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Receipt ID input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Receipt Slip Number</label>
            <input
              type="text"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              placeholder="e.g. SAV-XXXXXX"
              required
              disabled={uploading}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none selectable"
            />
          </div>

          {/* Optional notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Internal Notes (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add payment method, special status, or notes here..."
              rows={3}
              disabled={uploading}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-900 focus:border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none resize-none selectable"
            />
          </div>

          {/* Receipt attachment file input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Upload Proof (Slip Image)</label>
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProofFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-slate-900 file:text-slate-300 hover:file:bg-slate-800 file:transition-colors file:cursor-pointer cursor-pointer border border-dashed border-slate-900 p-2.5 rounded-xl bg-slate-950/20"
            />
            {proofFile && (
              <p className="text-[10px] text-emerald-400 font-medium">
                Selected file: {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
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

          {/* Form Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsSheetOpen(false)}
              disabled={uploading}
              className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer select-none"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Deposit...
                </>
              ) : (
                "Save Entry"
              )}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
