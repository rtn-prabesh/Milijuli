"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Search, Filter, Shield, ShieldAlert, CheckCircle2, 
  XCircle, Clock, MoreVertical, RefreshCw, Star, Trash2 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAppStore } from "@/store/useAppStore";
import { supabase } from "@/utils/supabase";

export default function Members() {
  const { profile: loggedInProfile } = useAuth();
  
  // Zustand store properties
  const profiles = useAppStore((state) => state.profiles);
  const updateProfileStatus = useAppStore((state) => state.updateProfileStatus);
  const loading = useAppStore((state) => state.loading);

  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "member">("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  // Toggle user role between 'admin' and 'member'
  const handleToggleRole = async (profileId: string, currentRole: "admin" | "member") => {
    if (profileId === loggedInProfile?.id) {
      setLocalError("You cannot toggle your own administrative privileges.");
      return;
    }

    setUpdatingId(profileId);
    setLocalError(null);

    const nextRole = currentRole === "admin" ? "member" : "admin";

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: nextRole })
        .eq("id", profileId);

      if (error) throw error;
      // Realtime listener in the store will automatically pick up this change and update local state!
    } catch (err: any) {
      console.error("[MembersPage] Role toggle failed:", err.message);
      setLocalError(`Failed to update role: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Status update wrapper
  const handleUpdateStatus = async (profileId: string, status: "approved" | "pending" | "rejected") => {
    if (profileId === loggedInProfile?.id) {
      setLocalError("You cannot modify your own approval status.");
      return;
    }

    setUpdatingId(profileId);
    setLocalError(null);
    try {
      await updateProfileStatus(profileId, status);
    } catch (err: any) {
      setLocalError(err.message || "Failed to update member status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter profiles based on search and filters
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      // 1. Status Filter
      if (statusFilter !== "all" && p.status !== statusFilter) return false;

      // 2. Role Filter
      if (roleFilter !== "all" && p.role !== roleFilter) return false;

      // 3. Search text
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const nameMatch = p.full_name.toLowerCase().includes(query);
        const phoneMatch = p.phone_number?.toLowerCase().includes(query) || false;
        const addressMatch = p.address?.toLowerCase().includes(query) || false;
        
        if (!nameMatch && !phoneMatch && !addressMatch) return false;
      }

      return true;
    });
  }, [profiles, statusFilter, roleFilter, searchTerm]);

  // Status Badge Metadata
  const getStatusBadge = (status: typeof profiles[0]["status"]) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
          icon: CheckCircle2,
        };
      case "pending":
        return {
          label: "Pending Approval",
          colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
          icon: Clock,
        };
      case "rejected":
        return {
          label: "Rejected",
          colorClass: "bg-red-500/10 border-red-500/20 text-red-400",
          icon: XCircle,
        };
    }
  };

  const isAdmin = loggedInProfile?.role === "admin";

  return (
    <div className="space-y-6">
      {/* Top Banner Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="w-5.5 h-5.5 text-emerald-400" />
            Milijuli Group Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin 
              ? "Manage all registered user applications, update roles, and audit access credentials."
              : "Directory list of all approved audit members and group contributors."}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search directory by name, phone, or location..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/40 rounded-xl border border-slate-900 focus:outline-none focus:border-slate-800 text-xs text-slate-300 placeholder-slate-600 transition-colors selectable"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-400 font-semibold focus:outline-none cursor-pointer select-none"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved Only</option>
            <option value="pending">Pending Only</option>
            <option value="rejected">Rejected Only</option>
          </select>

          {/* Role filter dropdown */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-xl text-xs text-slate-400 font-semibold focus:outline-none cursor-pointer select-none"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins Only</option>
            <option value="member">Members Only</option>
          </select>
        </div>
      </div>

      {/* Local errors display */}
      {localError && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 text-xs text-red-400 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 shrink-0" />
          <span>{localError}</span>
        </div>
      )}

      {/* Members Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading.profiles && filteredProfiles.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            Loading registry ledger...
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl glass border border-slate-900/60 space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-900/60 border border-slate-800 flex items-center justify-center text-slate-600 mx-auto">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-400">No members match criteria</p>
            <p className="text-[10px] text-slate-600 max-w-xs mx-auto">
              We couldn't find any member entries that match the selected name queries and filters.
            </p>
          </div>
        ) : (
          filteredProfiles.map((p) => {
            const BadgeMeta = getStatusBadge(p.status);
            const BadgeIcon = BadgeMeta.icon;
            const isSelf = p.id === loggedInProfile?.id;
            const isPending = p.status === "pending";
            const isApproved = p.status === "approved";
            const isRejected = p.status === "rejected";

            return (
              <div 
                key={p.id}
                className={`p-5 rounded-2xl glass border border-slate-900/60 relative overflow-hidden flex flex-col justify-between gap-5 transition-all duration-300 hover:border-slate-800/80 ${
                  isSelf ? "border-emerald-500/20 bg-emerald-500/[0.02]" : ""
                }`}
              >
                {/* Header: Photo and Badges */}
                <div className="flex items-start gap-4">
                  {/* Photo / initials */}
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center text-slate-300 font-bold uppercase relative overflow-hidden">
                    {p.profile_photo ? (
                      <img src={p.profile_photo} alt={p.full_name} className="w-full h-full object-cover" />
                    ) : (
                      p.full_name.substring(0, 2)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="text-xs font-black text-slate-200 block truncate">
                        {p.full_name}
                      </h3>
                      {isSelf && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest px-1 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5 truncate">
                      Joined {new Date(p.joined_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 text-[10px] text-slate-400 border-y border-slate-900/60 py-3">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 uppercase tracking-widest font-bold">Contact</span>
                    <span className="font-semibold text-slate-300 truncate select-all">{p.phone_number || "No contact info"}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 uppercase tracking-widest font-bold">Address</span>
                    <span className="font-semibold text-slate-300 truncate">{p.address || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500 uppercase tracking-widest font-bold">Role</span>
                    <span className="font-bold flex items-center gap-1 text-slate-300">
                      {p.role === "admin" ? (
                        <>
                          <Shield className="w-3.5 h-3.5 text-emerald-400" /> Admin
                        </>
                      ) : (
                        "Member"
                      )}
                    </span>
                  </div>
                </div>

                {/* Footer Controls: Badges and Admin Actions */}
                <div className="flex items-center justify-between gap-3">
                  {/* Status Badge */}
                  <div className={`px-2.5 py-1.5 border rounded-lg flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${BadgeMeta.colorClass}`}>
                    <BadgeIcon className="w-3.5 h-3.5" />
                    <span>{BadgeMeta.label}</span>
                  </div>

                  {/* Admin controls */}
                  {isAdmin && !isSelf && (
                    <div className="flex gap-2">
                      {/* Toggles role */}
                      <button
                        onClick={() => handleToggleRole(p.id, p.role)}
                        disabled={updatingId === p.id}
                        className="p-1.5 hover:bg-slate-900 rounded-lg border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer select-none"
                        title={p.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                      >
                        <Shield className={`w-4 h-4 ${p.role === "admin" ? "text-indigo-400" : ""}`} />
                      </button>

                      {/* Dropdown controls or conditional buttons */}
                      {isPending && (
                        <div className="flex gap-1 select-none">
                          <button
                            onClick={() => handleUpdateStatus(p.id, "approved")}
                            disabled={updatingId === p.id}
                            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(p.id, "rejected")}
                            disabled={updatingId === p.id}
                            className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {(isApproved || isRejected) && (
                        <select
                          value={p.status}
                          disabled={updatingId === p.id}
                          onChange={(e) => handleUpdateStatus(p.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg text-[9px] font-bold uppercase text-slate-400 focus:outline-none cursor-pointer"
                        >
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="pending">Pending</option>
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
