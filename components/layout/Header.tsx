"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Shield, LogOut, X, CheckCircle2, Trash2, PiggyBank, HandCoins, Receipt } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import ToastContainer from "@/components/ui/ToastContainer";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout } = useAuth();
  
  // Zustand notifications state & actions
  const notifications = useAppStore((state) => state.notifications);
  const markNotificationsAsRead = useAppStore((state) => state.markNotificationsAsRead);
  const clearNotifications = useAppStore((state) => state.clearNotifications);

  // Dropdown open state
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Compute unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // We need to import useMemo - wait! Let's ensure it is imported.
  // Yes! React has { useState, useEffect } but we need { useState, useEffect, useMemo } from "react".
  // Let's correct this import in the file: import React, { useState, useEffect, useMemo } from "react";

  // Compute dynamic page title based on the active path
  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Overview Dashboard";
      case "/savings":
        return "Savings Registry";
      case "/loans":
        return "Loans & Outstanding Ledger";
      case "/members":
        return "Milijuli Members";
      default:
        if (pathname?.startsWith("/savings/")) return "Savings Details";
        if (pathname?.startsWith("/loans/")) return "Loan Registry";
        return "Sahakari Registry";
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Helper to format relative timestamp
  const getRelativeTime = (timestampStr: string) => {
    try {
      const diff = Date.now() - new Date(timestampStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return new Date(timestampStr).toLocaleDateString(undefined, { 
        month: "short", 
        day: "numeric" 
      });
    } catch {
      return "";
    }
  };

  const getNotifIcon = (type: typeof notifications[0]["type"]) => {
    switch (type) {
      case "saving":
        return { icon: PiggyBank, colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "loan":
        return { icon: HandCoins, colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" };
      case "payment":
        return { icon: Receipt, colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/70 border-b border-slate-900/60 backdrop-blur-xl h-16 px-4 md:px-8 flex items-center justify-between select-none">
      {/* Toast Notifications container overlay */}
      <ToastContainer />

      {/* Page Title */}
      <div>
        <h2 className="text-md md:text-lg font-bold text-slate-100 tracking-tight">
          {getPageTitle()}
        </h2>
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider hidden md:block">
          Milijuli Secure Ledger v1.0
        </span>
      </div>

      {/* Top Utilities & Mobile Profile */}
      <div className="flex items-center gap-3 md:gap-4 relative">
        {/* Notification Bell Button */}
        <button 
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            if (!dropdownOpen && unreadCount > 0) {
              // Optionally mark as read immediately or let them press the mark all as read button
            }
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all transform active:scale-90 relative cursor-pointer ${
            dropdownOpen 
              ? "bg-slate-800 border-slate-700 text-white" 
              : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
          }`}
        >
          <Bell className="w-4.5 h-4.5" />
          
          {/* Animated red/green unread dot badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-black text-slate-950 animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Backdrop catcher to close dropdown on click outside */}
        {dropdownOpen && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setDropdownOpen(false)}
          />
        )}

        {/* Notifications list dropdown */}
        {dropdownOpen && (
          <div className="absolute right-0 top-11 z-50 w-80 glass bg-slate-900/95 border border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col max-h-[380px] animate-fade-in select-text">
            {/* Header toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 select-none">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Alert Center</span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markNotificationsAsRead()}
                    className="text-[9px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
                    title="Mark all read"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Read All
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      clearNotifications();
                      setDropdownOpen(false);
                    }}
                    className="text-[9px] font-bold text-slate-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-colors"
                    title="Clear list"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Notifications Body */}
            <div className="overflow-y-auto no-scrollbar flex-1 divide-y divide-slate-800 py-1">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 select-none">
                  <Bell className="w-8 h-8 text-slate-700 animate-pulse" />
                  <span>No notifications logged yet.</span>
                </div>
              ) : (
                notifications.map((notif) => {
                  const meta = getNotifIcon(notif.type);
                  const Icon = meta.icon;
                  return (
                    <div 
                      key={notif.id}
                      className={`py-3 flex items-start gap-3 hover:bg-slate-900/20 transition-colors rounded-xl px-1.5 ${
                        !notif.read ? "border-l-2 border-l-emerald-500/50 pl-1" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg border border-white/5 flex items-center justify-center shrink-0 ${meta.colorClass}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[11px] font-bold text-slate-200 block truncate leading-tight">
                            {notif.title}
                          </span>
                          <span className="text-[8px] text-slate-500 font-bold shrink-0 block mt-0.5 select-none">
                            {getRelativeTime(notif.timestamp)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed block mt-1">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* User Info (Visible on mobile head since sidebar is hidden) */}
        {profile && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-900">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xs text-slate-300 font-bold uppercase overflow-hidden md:hidden">
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                profile.full_name.substring(0, 2)
              )}
            </div>
            
            {/* Show admin role badge in top header for instant context */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-300 block">
                {profile.full_name.split(" ")[0]}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                {profile.role}
              </span>
            </div>

            {profile.role === "admin" && (
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-400 hidden md:flex">
                <Shield className="w-3.5 h-3.5" />
              </div>
            )}

            {/* Direct Logout on Mobile Header */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-red-950/20 border border-slate-800 hover:border-red-500/20 flex md:hidden items-center justify-center text-slate-500 hover:text-red-400 transition-all transform active:scale-90 cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
