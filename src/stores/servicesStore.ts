import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { differenceInDays, parseISO } from "date-fns";

export interface Service {
  id: string;
  project_name: string;
  service_name: string;
  login?: string;
  url?: string;
  expires_at: string;
  cost?: number;
  currency: string;
  notes?: string;
  category?: string;
  notify_days: number;
  created_at: string;
}

export function getDaysRemaining(expiresAt: string): number {
  return differenceInDays(parseISO(expiresAt), new Date());
}

export function getExpiryStatus(daysRemaining: number): "ok" | "warning" | "critical" | "expired" {
  if (daysRemaining < 0) return "expired";
  if (daysRemaining <= 7) return "critical";
  if (daysRemaining <= 30) return "warning";
  return "ok";
}

interface ServicesState {
  services: Service[];
  loading: boolean;
  fetchServices: () => Promise<void>;
  createService: (input: Omit<Service, "id" | "created_at">) => Promise<void>;
  updateService: (input: Service) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  loading: false,

  fetchServices: async () => {
    set({ loading: true });
    try {
      const services = await invoke<Service[]>("get_services");
      set({ services });
    } finally {
      set({ loading: false });
    }
  },

  createService: async (input) => {
    await invoke("create_service", { input });
    await get().fetchServices();
  },

  updateService: async (input) => {
    await invoke("update_service", { input });
    await get().fetchServices();
  },

  deleteService: async (id: string) => {
    await invoke("delete_service", { id });
    set((state) => ({ services: state.services.filter((s) => s.id !== id) }));
  },
}));
