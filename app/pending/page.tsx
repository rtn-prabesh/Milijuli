"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, RefreshCw, LogOut, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function PendingApproval() {
  const router = useRouter();
  const { profile, loading, logout, refreshProfile } = useAuth();
  const [checking, setChecking] = useState(false);
  const [justApproved, setJustApproved] = useState(false);

  useEffect(() => {
    // If auth state is fully loaded and user is approved, automatically forward them to dashboard
    if (!loading && profile && profile.status === "approved") {
      router.push("/dashboard");
    }
  }, [profile, loading, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await refreshProfile();
      // If now approved, show success animation before routing
      if (profile && profile.status === "approved") {
        setJustApproved(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("[Pending] Error checking status:", err);
    } finally {
      // Keep loading a bit for realistic feel
      setTimeout(() => {
        setChecking(false);
      }, 800);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background aesthetic orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Pending App Container */}
      <div className="w-full max-w-md glass rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200/5 bg-slate-900/40 relative z-10 text-center space-y-6">
        {justApproved ? (
          /* Approved Success Transition */
          <div className="space-y-4 py-4 animate-scale-up">
            <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-400 tracking-tight">Account Approved!</h2>
            <p className="text-sm text-slate-400">Redirecting you to your dashboard...</p>
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-400 mt-2" />
          </div>
        ) : (
          /* Standard Waiting state */
          <>
            <div className="space-y-3">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5 pulse-effect mb-2">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-emerald-400 bg-clip-text text-transparent">
                Approval Pending
              </h2>
              {profile?.full_name && (
                <p className="text-sm text-slate-300 font-medium">Hello, {profile.full_name}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 leading-relaxed text-left space-y-2">
              <p>
                Your registration has been received successfully! Under sahakari audit guidelines, all new members must be authorized before accessing financial transaction records.
              </p>
              <p className="font-semibold text-emerald-400/90">
                👉 Please ask one of the two Milijuli group admins to approve your status.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {/* Check status button */}
              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {checking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    I am Approved, Check Status
                  </>
                )}
              </button>

              {/* Logout / Switch Accounts button */}
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-medium rounded-xl text-xs transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Use Another Account
              </button>
            </div>

            <div className="text-[10px] text-slate-600 pt-2">
              Milijuli Secure Access Audit Protocol v1.0
            </div>
          </>
        )}
      </div>
    </div>
  );
}
