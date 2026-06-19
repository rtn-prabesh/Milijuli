"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Lock, MapPin, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/utils/supabase";

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!fullName || !email || !phoneNumber || !password) {
      setErrorMsg("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      // 1. Sign up user via Supabase Auth
      // Passing raw_user_meta_data will automatically trigger handle_new_user() database function!
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone_number: phoneNumber,
            address: address,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log("[Register] User signed up successfully.");
        // Redirect to verification hold page
        router.push("/pending");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background aesthetic orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Register App Container */}
      <div className="w-full max-w-md glass rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200/5 bg-slate-900/40 relative z-10">
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 items-center justify-center shadow-lg shadow-emerald-500/10 mb-2">
            <svg viewBox="0 0 512 512" className="w-8 h-8">
              <path d="M 120 320 C 120 220, 220 180, 256 180 C 256 220, 220 320, 160 360 Z" fill="#ffffff" opacity="0.3" />
              <path d="M 392 320 C 392 220, 292 180, 256 180 C 256 220, 292 320, 352 360 Z" fill="#ffffff" opacity="0.6" />
              <circle cx="256" cy="220" r="45" fill="#ffffff" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-xs text-slate-400">Join Milijuli for transparent savings & loans</p>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-400 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prabesh Bhandari"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm outline-none text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm outline-none text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Phone input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Phone Number *</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm outline-none text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Address input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Address (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Kathmandu, Nepal"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm outline-none text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 rounded-xl border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-sm outline-none text-slate-100 placeholder-slate-600 transition-all"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-sm shadow-xl shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-semibold transition-all">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
