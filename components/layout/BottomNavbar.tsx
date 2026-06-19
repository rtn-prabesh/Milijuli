"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PiggyBank, HandCoins, Users } from "lucide-react";

export default function BottomNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Savings",
      href: "/savings",
      icon: PiggyBank,
    },
    {
      label: "Loans",
      href: "/loans",
      icon: HandCoins,
    },
    {
      label: "Members",
      href: "/members",
      icon: Users,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/70 backdrop-blur-xl border-t border-slate-900/60 pb-safe-bottom md:hidden shadow-2xl flex justify-around items-center h-16 px-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Match base routes accurately
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center flex-1 py-1 relative text-center group cursor-pointer"
          >
            {/* Active Highlight Ambient Glow */}
            {isActive && (
              <span className="absolute -top-1 w-10 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-lg shadow-emerald-500/50" />
            )}

            <div
              className={`p-1.5 rounded-xl transition-all duration-300 transform ${
                isActive
                  ? "text-emerald-400 scale-110 bg-emerald-500/10"
                  : "text-slate-500 group-hover:text-slate-300"
              }`}
            >
              <Icon className="w-5.5 h-5.5 transition-transform" />
            </div>

            <span
              className={`text-[9px] font-semibold tracking-wide mt-0.5 transition-colors ${
                isActive
                  ? "text-emerald-400 font-bold"
                  : "text-slate-500 group-hover:text-slate-400"
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
