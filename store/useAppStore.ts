import { create } from "zustand";
import { supabase } from "@/utils/supabase";
import { Profile } from "@/context/AuthContext";

// ==========================================
// 1. Entity Type Definitions
// ==========================================

export interface Saving {
  id: string;
  member_id: string;
  amount: number;
  date: string;
  receipt_number: string;
  note?: string;
  proof_url?: string;
  created_by?: string | null;
  created_at: string;
  isOptimistic?: boolean;
}

export interface Loan {
  id: string;
  member_id: string;
  amount: number;
  interest_rate: number;
  date_issued: string;
  due_date?: string;
  receipt_number: string;
  status: "active" | "paid" | "overdue";
  note?: string;
  proof_url?: string;
  created_by?: string | null;
  created_at: string;
  isOptimistic?: boolean;
}

export interface Payment {
  id: string;
  loan_id: string;
  amount: number;
  date: string;
  receipt_number: string;
  note?: string;
  proof_url?: string;
  created_by?: string | null;
  created_at: string;
  isOptimistic?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "saving" | "loan" | "payment";
}

// ==========================================
// 2. Global State Interface
// ==========================================

interface AppState {
  // Collections
  profiles: Profile[];
  savings: Saving[];
  loans: Loan[];
  payments: Payment[];
  notifications: AppNotification[];

  // Loading States
  loading: {
    profiles: boolean;
    savings: boolean;
    loans: boolean;
    payments: boolean;
  };

  // Status indicators
  error: string | null;
  realtimeSubscribed: boolean;

  // Initial Fetches
  fetchProfiles: () => Promise<void>;
  fetchSavings: () => Promise<void>;
  fetchLoans: () => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchAllData: () => Promise<void>;

  // Optimistic Updates & Writes
  addSaving: (savingData: Omit<Saving, "id" | "created_at">) => Promise<void>;
  addLoan: (loanData: Omit<Loan, "id" | "created_at">) => Promise<void>;
  addPayment: (paymentData: Omit<Payment, "id" | "created_at">) => Promise<void>;
  updateProfileStatus: (profileId: string, status: "pending" | "approved" | "rejected") => Promise<void>;

  // Notification Actions
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markNotificationsAsRead: () => void;
  clearNotifications: () => void;

  // Realtime Sync
  subscribeRealtime: () => () => void;
  clearError: () => void;
}

// ==========================================
// 3. Zustand Store Implementation
// ==========================================

export const useAppStore = create<AppState>((set, get) => ({
  profiles: [],
  savings: [],
  loans: [],
  payments: [],

  loading: {
    profiles: false,
    savings: false,
    loans: false,
    payments: false,
  },

  error: null,
  realtimeSubscribed: false,
  notifications: [],

  clearError: () => set({ error: null }),

  addNotification: (notification) => {
    const newNotif: AppNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications].slice(0, 50),
    }));
  },

  markNotificationsAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  clearNotifications: () => set({ notifications: [] }),

  // Initial Fetches
  fetchProfiles: async () => {
    set((state) => ({ loading: { ...state.loading, profiles: true } }));
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });

      if (error) throw error;
      set({ profiles: (data as Profile[]) || [] });
    } catch (err: any) {
      console.error("[Store] Error fetching profiles:", err.message);
      set({ error: err.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, profiles: false } }));
    }
  },

  fetchSavings: async () => {
    set((state) => ({ loading: { ...state.loading, savings: true } }));
    try {
      const { data, error } = await supabase
        .from("savings")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      
      // Parse amount numeric fields to javascript numbers
      const parsedSavings = (data || []).map((s: any) => ({
        ...s,
        amount: parseFloat(s.amount),
      }));

      set({ savings: parsedSavings });
    } catch (err: any) {
      console.error("[Store] Error fetching savings:", err.message);
      set({ error: err.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, savings: false } }));
    }
  },

  fetchLoans: async () => {
    set((state) => ({ loading: { ...state.loading, loans: true } }));
    try {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("date_issued", { ascending: false });

      if (error) throw error;

      const parsedLoans = (data || []).map((l: any) => ({
        ...l,
        amount: parseFloat(l.amount),
        interest_rate: parseFloat(l.interest_rate),
      }));

      set({ loans: parsedLoans });
    } catch (err: any) {
      console.error("[Store] Error fetching loans:", err.message);
      set({ error: err.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, loans: false } }));
    }
  },

  fetchPayments: async () => {
    set((state) => ({ loading: { ...state.loading, payments: true } }));
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const parsedPayments = (data || []).map((p: any) => ({
        ...p,
        amount: parseFloat(p.amount),
      }));

      set({ payments: parsedPayments });
    } catch (err: any) {
      console.error("[Store] Error fetching payments:", err.message);
      set({ error: err.message });
    } finally {
      set((state) => ({ loading: { ...state.loading, payments: false } }));
    }
  },

  fetchAllData: async () => {
    const store = get();
    await Promise.all([
      store.fetchProfiles(),
      store.fetchSavings(),
      store.fetchLoans(),
      store.fetchPayments(),
    ]);
  },

  // Optimistic Writes
  addSaving: async (savingData: Omit<Saving, "id" | "created_at">) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempSaving: Saving = {
      ...savingData,
      id: tempId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const previousSavings = get().savings;

    // 1. Optimistic update (UI updates instantly)
    set({ savings: [tempSaving, ...previousSavings] });

    try {
      // 2. background database synchronizer
      const { data, error } = await supabase
        .from("savings")
        .insert({
          member_id: savingData.member_id,
          amount: savingData.amount,
          date: savingData.date,
          receipt_number: savingData.receipt_number,
          note: savingData.note,
          proof_url: savingData.proof_url,
          created_by: savingData.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      const parsedNewSaving = {
        ...data,
        amount: parseFloat(data.amount),
        isOptimistic: false,
      };

      // 3. Swap the temporary record with the actual database confirmed record
      set((state) => ({
        savings: state.savings.map((s) => (s.id === tempId ? parsedNewSaving : s)),
      }));
    } catch (err: any) {
      console.error("[Store] Error saving record (rolling back):", err.message);
      // 4. Automatic rollback on network error
      set({ savings: previousSavings, error: err.message });
      throw err;
    }
  },

  addLoan: async (loanData: Omit<Loan, "id" | "created_at">) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempLoan: Loan = {
      ...loanData,
      id: tempId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const previousLoans = get().loans;
    set({ loans: [tempLoan, ...previousLoans] });

    try {
      const { data, error } = await supabase
        .from("loans")
        .insert({
          member_id: loanData.member_id,
          amount: loanData.amount,
          interest_rate: loanData.interest_rate,
          date_issued: loanData.date_issued,
          due_date: loanData.due_date,
          receipt_number: loanData.receipt_number,
          status: loanData.status,
          note: loanData.note,
          proof_url: loanData.proof_url,
          created_by: loanData.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      const parsedNewLoan = {
        ...data,
        amount: parseFloat(data.amount),
        interest_rate: parseFloat(data.interest_rate),
        isOptimistic: false,
      };

      set((state) => ({
        loans: state.loans.map((l) => (l.id === tempId ? parsedNewLoan : l)),
      }));
    } catch (err: any) {
      console.error("[Store] Error creating loan (rolling back):", err.message);
      set({ loans: previousLoans, error: err.message });
      throw err;
    }
  },

  addPayment: async (paymentData: Omit<Payment, "id" | "created_at">) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const tempPayment: Payment = {
      ...paymentData,
      id: tempId,
      created_at: new Date().toISOString(),
      isOptimistic: true,
    };

    const previousPayments = get().payments;
    const previousLoans = get().loans;

    // Apply optimistic updates to payments log
    set({ payments: [tempPayment, ...previousPayments] });

    try {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          loan_id: paymentData.loan_id,
          amount: paymentData.amount,
          date: paymentData.date,
          receipt_number: paymentData.receipt_number,
          note: paymentData.note,
          proof_url: paymentData.proof_url,
          created_by: paymentData.created_by,
        })
        .select()
        .single();

      if (error) throw error;

      const parsedNewPayment = {
        ...data,
        amount: parseFloat(data.amount),
        isOptimistic: false,
      };

      set((state) => ({
        payments: state.payments.map((p) => (p.id === tempId ? parsedNewPayment : p)),
      }));
    } catch (err: any) {
      console.error("[Store] Error logging payment (rolling back):", err.message);
      set({ payments: previousPayments, loans: previousLoans, error: err.message });
      throw err;
    }
  },

  updateProfileStatus: async (profileId: string, status: "pending" | "approved" | "rejected") => {
    const previousProfiles = get().profiles;

    // Optimistically toggle status in store
    set((state) => ({
      profiles: state.profiles.map((p) => (p.id === profileId ? { ...p, status } : p)),
    }));

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", profileId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        profiles: state.profiles.map((p) => (p.id === profileId ? (data as Profile) : p)),
      }));
    } catch (err: any) {
      console.error("[Store] Error updating user profile status (rolling back):", err.message);
      set({ profiles: previousProfiles, error: err.message });
      throw err;
    }
  },

  // Realtime Subscriptions with deduplication logic
  subscribeRealtime: () => {
    if (get().realtimeSubscribed) {
      return () => {};
    }

    console.log("[Store] Subscribing to Supabase Realtime changes for public schema...");

    const channel = supabase
      .channel("public-db-changes")
      // 1. PROFILES Table Listener
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          console.log("[Realtime] Profile Change:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            set((state) => {
              if (state.profiles.some((p) => p.id === newRecord.id)) return {};
              return {
                profiles: [...state.profiles, newRecord as Profile].sort((a, b) =>
                  a.full_name.localeCompare(b.full_name)
                ),
              };
            });
          } else if (eventType === "UPDATE") {
            set((state) => ({
              profiles: state.profiles.map((p) =>
                p.id === newRecord.id ? { ...p, ...(newRecord as Profile) } : p
              ),
            }));
          } else if (eventType === "DELETE") {
            set((state) => ({
              profiles: state.profiles.filter((p) => p.id !== oldRecord.id),
            }));
          }
        }
      )
      // 2. SAVINGS Table Listener
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "savings" },
        (payload) => {
          console.log("[Realtime] Saving Change:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            const parsedSaving: Saving = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
            } as Saving;

            // Trigger notification
            const member = get().profiles.find((p) => p.id === parsedSaving.member_id);
            const name = member ? member.full_name : "A member";
            get().addNotification({
              title: "New Savings Deposit",
              message: `${name} deposited ${new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(parsedSaving.amount)}`,
              type: "saving",
            });

            set((state) => {
              // Deduplicate if already added optimistically
              if (state.savings.some((s) => s.id === parsedSaving.id)) return {};
              return { savings: [parsedSaving, ...state.savings] };
            });
          } else if (eventType === "UPDATE") {
            const parsedSaving: Saving = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
            } as Saving;

            set((state) => ({
              savings: state.savings.map((s) => (s.id === parsedSaving.id ? parsedSaving : s)),
            }));
          } else if (eventType === "DELETE") {
            set((state) => ({
              savings: state.savings.filter((s) => s.id !== oldRecord.id),
            }));
          }
        }
      )
      // 3. LOANS Table Listener
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loans" },
        (payload) => {
          console.log("[Realtime] Loan Change:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            const parsedLoan: Loan = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
              interest_rate: parseFloat(newRecord.interest_rate),
            } as Loan;

            // Trigger notification
            const member = get().profiles.find((p) => p.id === parsedLoan.member_id);
            const name = member ? member.full_name : "A member";
            get().addNotification({
              title: "New Loan Issued",
              message: `${name} was issued a loan of ${new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(parsedLoan.amount)}`,
              type: "loan",
            });

            set((state) => {
              if (state.loans.some((l) => l.id === parsedLoan.id)) return {};
              return { loans: [parsedLoan, ...state.loans] };
            });
          } else if (eventType === "UPDATE") {
            const parsedLoan: Loan = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
              interest_rate: parseFloat(newRecord.interest_rate),
            } as Loan;

            set((state) => ({
              loans: state.loans.map((l) => (l.id === parsedLoan.id ? parsedLoan : l)),
            }));
          } else if (eventType === "DELETE") {
            set((state) => ({
              loans: state.loans.filter((l) => l.id !== oldRecord.id),
            }));
          }
        }
      )
      // 4. PAYMENTS Table Listener
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        (payload) => {
          console.log("[Realtime] Payment Change:", payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === "INSERT") {
            const parsedPayment: Payment = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
            } as Payment;

            // Trigger notification
            const loan = get().loans.find((l) => l.id === parsedPayment.loan_id);
            const member = loan ? get().profiles.find((p) => p.id === loan.member_id) : null;
            const name = member ? member.full_name : "A member";
            get().addNotification({
              title: "New Repayment Recorded",
              message: `${name} paid back ${new Intl.NumberFormat("en-NP", { style: "currency", currency: "NPR", maximumFractionDigits: 0 }).format(parsedPayment.amount)}`,
              type: "payment",
            });

            set((state) => {
              if (state.payments.some((p) => p.id === parsedPayment.id)) return {};
              return { payments: [parsedPayment, ...state.payments] };
            });
          } else if (eventType === "UPDATE") {
            const parsedPayment: Payment = {
              ...newRecord,
              amount: parseFloat(newRecord.amount),
            } as Payment;

            set((state) => ({
              payments: state.payments.map((p) => (p.id === parsedPayment.id ? parsedPayment : p)),
            }));
          } else if (eventType === "DELETE") {
            set((state) => ({
              payments: state.payments.filter((p) => p.id !== oldRecord.id),
            }));
          }
        }
      )
      .subscribe();

    set({ realtimeSubscribed: true });

    // Return an unsubscribe cleanup handler
    return () => {
      console.log("[Store] Unsubscribing from Realtime Postgres listeners...");
      channel.unsubscribe();
      set({ realtimeSubscribed: false });
    };
  },
}));
