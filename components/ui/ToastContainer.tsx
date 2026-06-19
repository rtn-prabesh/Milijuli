"use client";

import React, { useEffect, useState } from "react";
import { useAppStore, AppNotification } from "@/store/useAppStore";
import { PiggyBank, HandCoins, Receipt, X, Bell } from "lucide-react";

export default function ToastContainer() {
  const notifications = useAppStore((state) => state.notifications);
  const [activeToasts, setActiveToasts] = useState<AppNotification[]>([]);
  const [lastId, setLastId] = useState<string | null>(null);

  // Monitor store notifications to show real-time toasts
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const latest = notifications[0];
    
    // If it's a new notification we haven't seen yet and is unread
    if (latest.id !== lastId && !latest.read) {
      setLastId(latest.id);
      
      // Ensure it was triggered recently (within the last 8 seconds)
      // This protects against showing toasts for older records loaded during initial fetch
      const timeDiff = Date.now() - new Date(latest.timestamp).getTime();
      if (timeDiff < 8000) {
        // Add to active display toasts list
        setActiveToasts((prev) => [latest, ...prev].slice(0, 3)); // show max 3 simultaneously
        
        // Schedule dismissal
        setTimeout(() => {
          setActiveToasts((prev) => prev.filter((t) => t.id !== latest.id));
        }, 4500);
      }
    }
  }, [notifications, lastId]);

  // Remove toast manually
  const handleDismiss = (id: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getToastMeta = (type: AppNotification["type"]) => {
    switch (type) {
      case "saving":
        return {
          icon: PiggyBank,
          borderColor: "border-emerald-500/30",
          iconColor: "text-emerald-400 bg-emerald-500/10",
        };
      case "loan":
        return {
          icon: HandCoins,
          borderColor: "border-indigo-500/30",
          iconColor: "text-indigo-400 bg-indigo-500/10",
        };
      case "payment":
        return {
          icon: Receipt,
          borderColor: "border-amber-500/30",
          iconColor: "text-amber-400 bg-amber-500/10",
        };
    }
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2.5 max-w-sm w-full mx-auto select-none pointer-events-none">
      {activeToasts.map((toast) => {
        const meta = getToastMeta(toast.type);
        const Icon = meta.icon;

        return (
          <div
            key={toast.id}
            className={`w-full glass bg-slate-900/95 border ${meta.borderColor} p-4 rounded-2xl shadow-2xl flex items-start gap-3 pointer-events-auto animate-slide-up transition-all`}
            style={{
              animationDuration: "0.35s",
            }}
          >
            {/* Type Icon */}
            <div className={`w-9 h-9 rounded-xl border border-white/5 flex items-center justify-center shrink-0 ${meta.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <span className="text-xs font-black text-slate-100 block">
                {toast.title}
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                {toast.message}
              </span>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => handleDismiss(toast.id)}
              className="w-6 h-6 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
