import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface Note {
  id: string;
  title: string;
  content?: string;
  category_id?: string;
  completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

interface NotesState {
  notes: Note[];
  categories: Category[];
  selectedCategoryId: string | null;
  loading: boolean;
  fetchNotes: (categoryId?: string) => Promise<void>;
  fetchCategories: () => Promise<void>;
  createNote: (input: { title: string; content?: string; category_id?: string }) => Promise<Note>;
  updateNote: (input: {
    id: string;
    title: string;
    content?: string;
    category_id?: string;
  }) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleNote: (id: string, completed: boolean) => Promise<void>;
  createCategory: (input: { name: string; color: string }) => Promise<Category>;
  updateCategory: (input: { id: string; name: string; color: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  categories: [],
  selectedCategoryId: null,
  loading: false,

  fetchNotes: async (categoryId?: string) => {
    set({ loading: true });
    try {
      const notes = await invoke<Note[]>("get_notes", {
        categoryId: categoryId ?? null,
      });
      set({ notes });
    } finally {
      set({ loading: false });
    }
  },

  fetchCategories: async () => {
    const categories = await invoke<Category[]>("get_categories");
    set({ categories });
  },

  createNote: async (input) => {
    const note = await invoke<Note>("create_note", { input });
    set((state) => ({ notes: [note, ...state.notes] }));
    return note;
  },

  updateNote: async (input) => {
    await invoke("update_note", { input });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === input.id ? { ...n, ...input, updated_at: new Date().toISOString() } : n
      ),
    }));
  },

  deleteNote: async (id: string) => {
    await invoke("delete_note", { id });
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  toggleNote: async (id: string, completed: boolean) => {
    await invoke("toggle_note", { id, completed });
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, completed, updated_at: new Date().toISOString() } : n
      ),
    }));
  },

  createCategory: async (input) => {
    const category = await invoke<Category>("create_category", { input });
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (input) => {
    await invoke("update_category", { input });
    set((state) => ({
      categories: state.categories.map((c) =>
        c.id === input.id ? { ...c, name: input.name, color: input.color } : c
      ),
    }));
  },

  deleteCategory: async (id: string) => {
    await invoke("delete_category", { id });
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
      notes: state.notes.map((n) =>
        n.category_id === id ? { ...n, category_id: undefined } : n
      ),
    }));
  },

  setSelectedCategory: (id) => {
    set({ selectedCategoryId: id });
    get().fetchNotes(id ?? undefined);
  },
}));
