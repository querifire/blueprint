import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Client {
  id: string;
  name: string;
  contact?: string;
  payment_type: "monthly" | "onetime";
  amount?: number;
  currency: string;
  notes?: string;
  payment_day?: number;
  created_at: string;
}

export interface ClientPayment {
  id: string;
  client_id: string;
  period: string;
  paid: boolean;
  paid_at?: string;
}

interface ClientsState {
  clients: Client[];
  payments: Record<string, ClientPayment[]>;
  loading: boolean;
  fetchClients: () => Promise<void>;
  fetchPayments: (clientId: string) => Promise<void>;
  createClient: (input: Omit<Client, "id" | "created_at">) => Promise<void>;
  updateClient: (input: Client) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  togglePayment: (clientId: string, period: string, paid: boolean) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  payments: {},
  loading: false,

  fetchClients: async () => {
    set({ loading: true });
    try {
      const clients = await invoke<Client[]>("get_clients");
      set({ clients });
    } finally {
      set({ loading: false });
    }
  },

  fetchPayments: async (clientId: string) => {
    const payments = await invoke<ClientPayment[]>("get_client_payments", { clientId });
    set((state) => ({ payments: { ...state.payments, [clientId]: payments } }));
  },

  createClient: async (input) => {
    await invoke("create_client", { input });
    await get().fetchClients();
  },

  updateClient: async (input) => {
    await invoke("update_client", { input });
    await get().fetchClients();
  },

  deleteClient: async (id: string) => {
    await invoke("delete_client", { id });
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
      payments: Object.fromEntries(Object.entries(state.payments).filter(([k]) => k !== id)),
    }));
  },

  togglePayment: async (clientId: string, period: string, paid: boolean) => {
    await invoke("toggle_payment", { clientId, period, paid });
    await get().fetchPayments(clientId);
  },
}));
