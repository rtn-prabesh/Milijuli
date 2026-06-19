"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNavbar from "@/components/layout/BottomNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const fetchAllData = useAppStore((state) => state.fetchAllData);
  const subscribeRealtime = useAppStore((state) => state.subscribeRealtime);

  // 1. Session interception & Route protection
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/login");
    } else if (profile) {
      if (profile.status !== "approved") {
        router.push("/pending");
      }
    }
  }, [user, profile, authLoading, router]);

  // 2. Fetch all collections & Bind realtime listeners on mounting
  useEffect(() => {
    if (!user || profile?.status !== "approved") return;

    // Load initial Supabase data collections
    fetchAllData();

    // Subscribe to public database changes (savings, loans, payments, profiles)
    const unsubscribe = subscribeRealtime();
    
    // Cleanup listeners on unmount
    return () => unsubscribe();
  }, [user, profile, fetchAllData, subscribeRealtime]);

  // If loading session, show animated loading screen
  if (authLoading || !user || !profile || profile.status !== "approved") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="text-center space-y-4 z-10 relative">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Validating audit keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Responsive Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        {/* Sticky Top Header */}
        <Header />

        {/* Dynamic page viewport scroll area */}
        <main className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-8 pb-20 md:pb-8 bg-slate-950">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in selectable">
            {children}
          </div>
        </main>

        {/* Persistent Bottom Navbar for Mobile */}
        <BottomNavbar />
      </div>
    </div>
  );
}
