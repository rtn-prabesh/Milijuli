"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, PiggyBank, HandCoins, Users, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Savings Stream",
      href: "/savings",
      icon: PiggyBank,
    },
    {
      label: "Loans & Ledger",
      href: "/loans",
      icon: HandCoins,
    },
    {
      label: "Member Directory",
      href: "/members",
      icon: Users,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-slate-950/40 border-r border-slate-900/60 backdrop-blur-xl shrink-0 p-6 select-none justify-between">
      <div className="space-y-8">
        {/* Top Logo / Brand section */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 items-center justify-center shadow-lg shadow-emerald-500/10">
            <svg viewBox="0 0 512 512" className="w-6 h-6">
              <path d="M 120 320 C 120 220, 220 180, 256 180 C 256 220, 220 320, 160 360 Z" fill="#ffffff" opacity="0.3" />
              <path d="M 392 320 C 392 220, 292 180, 256 180 C 256 220, 292 320, 352 360 Z" fill="#ffffff" opacity="0.6" />
              <circle cx="256" cy="220" r="45" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-black tracking-tight bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent block">
              Milijuli
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Group Savings
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="space-y-1.5 pt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all transform active:scale-98 cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/5 text-emerald-400 border-l-2 border-emerald-500 shadow-md shadow-emerald-500/5"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/40"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Section */}
      <div className="space-y-4 pt-6 border-t border-slate-900">
        {profile && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 font-bold uppercase relative overflow-hidden select-none">
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name.substring(0, 2)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-200 block truncate">
                {profile.full_name}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                {profile.role === "admin" && <Shield className="w-3 h-3 text-emerald-400 inline" />}
                {profile.role}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 bg-slate-950 hover:bg-red-950/20 border border-slate-900 hover:border-red-500/20 text-slate-400 hover:text-red-400 text-xs font-bold rounded-xl transition-all transform active:scale-98 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
