"use client";

import React, { useMemo } from "react";
import { PiggyBank, HandCoins, Users, ArrowUpRight, ShieldCheck, Clock, Layers, Sparkles, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import TransactionStream from "@/components/TransactionStream";
import Link from "next/link";
import AnalyticsChart from "@/components/dashboard/AnalyticsChart";

export default function Dashboard() {
  const { profile } = useAuth();
  
  // Zustand store collections & actions
  const savings = useAppStore((state) => state.savings);
  const loans = useAppStore((state) => state.loans);
  const payments = useAppStore((state) => state.payments);
  const profiles = useAppStore((state) => state.profiles);
  const updateProfileStatus = useAppStore((state) => state.updateProfileStatus);

  // Filter pending profiles for admin approvals
  const pendingProfiles = useMemo(() => {
    return profiles.filter((p) => p.status === "pending");
  }, [profiles]);

  // 1. Group Savings Total
  const totalSavings = useMemo(() => {
    return savings.reduce((sum, item) => sum + item.amount, 0);
  }, [savings]);

  // 2. Active Loans Outstanding Total
  const totalOutstandingLoans = useMemo(() => {
    // Map repayments
    const loanRepayments = new Map<string, number>();
    payments.forEach((p) => {
      const current = loanRepayments.get(p.loan_id) || 0;
      loanRepayments.set(p.loan_id, current + p.amount);
    });

    // Sum outstanding active loans
    return loans.reduce((sum, l) => {
      const paid = loanRepayments.get(l.id) || 0;
      const outstanding = Math.max(0, l.amount - paid);
      return sum + outstanding;
    }, 0);
  }, [loans, payments]);

  // 3. Approved Members Count
  const approvedMembersCount = useMemo(() => {
    return profiles.filter((p) => p.status === "approved").length;
  }, [profiles]);

  // 4. Personal My Savings Total (Member Dashboard)
  const mySavingsTotal = useMemo(() => {
    if (!profile) return 0;
    return savings
      .filter((s) => s.member_id === profile.id)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [savings, profile]);

  // 5. Personal My Outstanding Loans (Member Dashboard)
  const myOutstandingLoans = useMemo(() => {
    if (!profile) return 0;
    
    // Map repayments
    const loanRepayments = new Map<string, number>();
    payments.forEach((p) => {
      const current = loanRepayments.get(p.loan_id) || 0;
      loanRepayments.set(p.loan_id, current + p.amount);
    });

    return loans
      .filter((l) => l.member_id === profile.id)
      .reduce((sum, l) => {
        const paid = loanRepayments.get(l.id) || 0;
        const outstanding = Math.max(0, l.amount - paid);
        return sum + outstanding;
      }, 0);
  }, [loans, payments, profile]);

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
    <div className="space-y-6 select-none">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl glass bg-gradient-to-r from-slate-900/60 to-slate-900/30 border border-slate-900/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            Welcome back, {profile?.full_name ? profile.full_name.split(" ")[0] : "Member"}!
            {profile?.role === "admin" && (
              <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                <ShieldCheck className="w-3 h-3" /> Admin Mode
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounting period: Fiscal Year 2083/84 • Audit logs are synchronized and secured.
          </p>
        </div>
        
        <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-900 self-start md:self-auto">
          <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          Realtime Listener Active
        </div>
      </div>

      {/* Pending Member Registrations approvals card (Admin only) */}
      {profile?.role === "admin" && pendingProfiles.length > 0 && (
        <div className="p-6 rounded-2xl glass border border-amber-500/20 bg-amber-500/5 space-y-4 animate-fade-in select-none">
          <div className="flex items-center gap-2 text-amber-400">
            <Users className="w-5 h-5" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Pending Member Registrations ({pendingProfiles.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingProfiles.map((p) => (
              <div 
                key={p.id} 
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-900/60 flex items-center justify-between gap-4 select-text hover:border-slate-800 transition-colors"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {p.full_name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Phone: {p.phone_number || "None"} • Address: {p.address || "None"}
                  </span>
                  <span className="text-[9px] text-slate-600 block mt-1">
                    Joined: {new Date(p.joined_date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 select-none">
                  <button
                    onClick={() => updateProfileStatus(p.id, "approved")}
                    className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateProfileStatus(p.id, "rejected")}
                    className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profile?.role === "admin" ? (
          <>
            {/* Group Savings Fund */}
            <Link href="/savings" className="block cursor-pointer">
              <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 hover:border-slate-800 transition-all border border-slate-900/60 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Group Savings Fund</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {formatRupee(totalSavings)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0">
                  <PiggyBank className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Active Debt Ledger */}
            <Link href="/loans" className="block cursor-pointer">
              <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 hover:border-slate-800 transition-all border border-slate-900/60 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Debt Outstanding</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {formatRupee(totalOutstandingLoans)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shrink-0">
                  <HandCoins className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Registered Members count */}
            <Link href="/members" className="block cursor-pointer">
              <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 hover:border-slate-800 transition-all border border-slate-900/60 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Approved Group Members</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-100 group-hover:text-amber-400 transition-colors">
                    {approvedMembersCount} Members
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Link>
          </>
        ) : (
          <>
            {/* My Savings Balance */}
            <Link href="/savings" className="block cursor-pointer">
              <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 hover:border-slate-800 transition-all border border-slate-900/60 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">My Savings Balance</span>
                  <h3 className="text-lg md:text-xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {formatRupee(mySavingsTotal)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </Link>

            {/* My Active Loan Balances */}
            <Link href="/loans" className="block cursor-pointer">
              <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 hover:border-slate-800 transition-all border border-slate-900/60 flex items-center justify-between group">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">My Outstanding Loans</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {formatRupee(myOutstandingLoans)}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-indigo-400 bg-indigo-500/10 border-indigo-500/20 shrink-0">
                  <HandCoins className="w-6 h-6" />
                </div>
              </div>
            </Link>

            {/* Group Aggregates overview */}
            <div className="p-6 rounded-2xl glass hover:shadow-xl hover:shadow-slate-950/20 border border-slate-900/60 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Group Total Savings</span>
                <h3 className="text-lg md:text-xl font-black text-slate-100">
                  {formatRupee(totalSavings)}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl border flex items-center justify-center text-amber-400 bg-amber-500/10 border-amber-500/20 shrink-0">
                <PiggyBank className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Core Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction stream list (Left) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SVG Analytics Chart widget */}
          <AnalyticsChart />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Latest Activity Ledger</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Unified ledger timeline reflecting recent audits.</p>
              </div>
              
              <Link 
                href="/savings"
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-0.5 transition-colors"
              >
                All Records <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Standard Transaction stream limited to 5 items with filters disabled for dashboard cleanliness */}
            <TransactionStream limit={5} hideFilters={true} />
          </div>
        </div>

        {/* Shortcuts Panel (Right) */}
        <div className="p-6 rounded-2xl glass border border-slate-900/60 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Fast Desk Shortcuts</h3>
          </div>
          
          <div className="space-y-3">
            {/* Record savings shortcut */}
            <Link href="/savings" className="block group">
              <div className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/40 border border-slate-900 hover:border-slate-800 flex items-center justify-between transition-all active:scale-98 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block group-hover:text-emerald-400 transition-colors">
                    Record Member Savings
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    Admin only deposit registry desk
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
            </Link>

            {/* Issue credit loan shortcut */}
            <Link href="/loans" className="block group">
              <div className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/40 border border-slate-900 hover:border-slate-800 flex items-center justify-between transition-all active:scale-98 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block group-hover:text-indigo-400 transition-colors">
                    Issue Credit Loan
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    Admin only lending desk registry
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
            </Link>
            
            {/* Member Directory shortcut */}
            <Link href="/members" className="block group">
              <div className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-900/40 border border-slate-900 hover:border-slate-800 flex items-center justify-between transition-all active:scale-98 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block group-hover:text-amber-400 transition-colors">
                    Group Member Directory
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5 block">
                    View profile status and info
                  </span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
