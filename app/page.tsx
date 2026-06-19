"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // User is not signed in - redirect to login
      router.push("/login");
    } else if (profile) {
      // User is signed in - route depending on sahakari status
      if (profile.status === "approved") {
        router.push("/dashboard");
      } else if (profile.status === "pending") {
        router.push("/pending");
      } else {
        // Rejected
        router.push("/login");
      }
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background radial orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Premium Logo / Splash Screen Loader */}
      <div className="text-center space-y-6 relative z-10 animate-fade-in">
        <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 items-center justify-center shadow-2xl shadow-emerald-500/20 pulse-effect">
          <svg viewBox="0 0 512 512" className="w-14 h-14">
            <path d="M 120 320 C 120 220, 220 180, 256 180 C 256 220, 220 320, 160 360 Z" fill="#ffffff" opacity="0.3" />
            <path d="M 392 320 C 392 220, 292 180, 256 180 C 256 220, 292 320, 352 360 Z" fill="#ffffff" opacity="0.6" />
            <circle cx="256" cy="220" r="45" fill="#ffffff" />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-400 bg-clip-text text-transparent">
            Milijuli
          </h1>
          <p className="text-sm text-slate-400 font-medium tracking-wide">Savings & Loans Management</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-4">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          <span>Synchronizing security keys...</span>
        </div>
      </div>
    </div>
  );
}
