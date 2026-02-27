import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  actions?: Array<Record<string, unknown>>;
}

interface ChatState {
  messages: ChatMessage[];
  loading: boolean;
  loadHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  addMessage: (msg: Omit<ChatMessage, "id" | "created_at">) => ChatMessage;
  handleActions: (actions: Array<Record<string, unknown>>) => Promise<void>;
}

interface AddClientInput {
  name: string;
  contact?: string;
  payment_type: "monthly" | "onetime";
  amount?: number;
  currency?: string;
  notes?: string;
  payment_date?: string;
  payment_day?: number;
}

interface AddNoteItem {
  title: string;
  content?: string;
  category?: string;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  loading: false,

  loadHistory: async () => {
    try {
      const history = await invoke<ChatMessage[]>("get_chat_history", { limit: 50 });
      set({ messages: history });
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  },

  addMessage: (msg) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, newMsg] }));
    return newMsg;
  },

  sendMessage: async (content: string) => {
    get().addMessage({ role: "user", content });
    await invoke("save_chat_message", { role: "user", content });

    set({ loading: true });
    try {
      const history = get().messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await invoke<{ content: string; actions: Array<Record<string, unknown>> }>("chat_with_ai", {
        input: { messages: history },
      });

      get().addMessage({
        role: "assistant",
        content: response.content,
        actions: response.actions?.length ? response.actions : undefined,
      });

      await invoke("save_chat_message", {
        role: "assistant",
        content: response.content,
      });

      if (response.actions?.length) {
        for (const action of response.actions) {
          await handleAction(action);
        }
      }
    } catch (e: unknown) {
      get().addMessage({
        role: "assistant",
        content: `Ошибка: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      set({ loading: false });
    }
  },

  clearHistory: async () => {
    await invoke("clear_chat_history");
    set({ messages: [] });
  },

  handleActions: async (actions) => {
    for (const action of actions) {
      await handleAction(action);
    }
  },
}));

async function handleAction(action: Record<string, unknown>) {
  const actionType = action.action as string;
  const data = action.data as Record<string, unknown>;

  try {
    switch (actionType) {
      case "add_client":
        await invoke("create_client", { input: buildAddClientInput(data) });
        break;
      case "add_service":
        await invoke("create_service", { input: data });
        break;
      case "add_note": {
        const categories = await invoke<{ id: string; name: string }[]>("get_categories");
        const cache = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
        const items = buildNoteItems(data);
        for (const item of items) {
          const categoryId = await resolveCategoryId(item.category, cache);
          await invoke("create_note", {
            input: {
              title: item.title,
              content: item.content,
              category_id: categoryId,
            },
          });
        }
        break;
      }
      case "complete_note": {
        const notes = await invoke<{ id: string; title: string }[]>("get_notes", {
          categoryId: null,
        });
        const query = (data.title_query as string || "").toLowerCase();
        const found = notes.find((n) => n.title.toLowerCase().includes(query));
        if (found) {
          await invoke("toggle_note", { id: found.id, completed: true });
        }
        break;
      }
    }
  } catch (e) {
    console.error("Action failed:", e);
  }
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const normalized = value.replace(",", ".").replace(/[^\d.-]/g, "").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseIntSafe(value: unknown): number | undefined {
  const n = parseNumber(value);
  if (n === undefined) return undefined;
  return Math.trunc(n);
}

function parseString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function buildAddClientInput(data: Record<string, unknown>): AddClientInput {
  const name = parseString(data.name) ?? "Новый клиент";
  const rawType = parseString(data.payment_type)?.toLowerCase();
  const payment_type: "monthly" | "onetime" = rawType === "onetime" ? "onetime" : "monthly";
  const amount = parseNumber(data.amount);
  const payment_day = parseIntSafe(data.payment_day ?? data.day);
  const payment_date = parseString(data.payment_date ?? data.date);
  const currency = parseString(data.currency)?.toUpperCase() ?? "RUB";
  const contact = parseString(data.contact);
  const notes = parseString(data.notes);
  return {
    name,
    contact,
    payment_type,
    amount,
    currency,
    notes,
    payment_date,
    payment_day,
  };
}

function splitNoteLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter(Boolean);
}

function toNoteItem(value: unknown, forcedCategory?: string): AddNoteItem[] {
  if (!value) return [];
  if (typeof value === "string") {
    const lines = splitNoteLines(value);
    return lines.map((line) => ({ title: line, category: forcedCategory }));
  }
  if (Array.isArray(value)) {
    return value.flatMap((v) => toNoteItem(v, forcedCategory));
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const title = parseString(obj.title ?? obj.text ?? obj.name);
    const content = parseString(obj.content ?? obj.description);
    const category = parseString(obj.category ?? obj.group) ?? forcedCategory;
    if (!title) return [];
    return [{ title, content, category }];
  }
  return [];
}

function buildNoteItems(data: Record<string, unknown>): AddNoteItem[] {
  const items: AddNoteItem[] = [];
  items.push(...toNoteItem(data.title, parseString(data.category)));
  items.push(...toNoteItem(data.note, parseString(data.category)));
  items.push(...toNoteItem(data.notes));
  items.push(...toNoteItem(data.items));
  items.push(...toNoteItem(data.tasks));
  items.push(...toNoteItem(data.titles, parseString(data.category)));
  const byCategory = data.by_category;
  if (byCategory && typeof byCategory === "object" && !Array.isArray(byCategory)) {
    for (const [category, value] of Object.entries(byCategory as Record<string, unknown>)) {
      items.push(...toNoteItem(value, category));
    }
  }
  const unique = new Map<string, AddNoteItem>();
  for (const item of items) {
    const title = parseString(item.title);
    if (!title) continue;
    const key = `${title.toLowerCase()}::${(item.category ?? "").toLowerCase()}`;
    if (!unique.has(key)) {
      unique.set(key, {
        title,
        content: parseString(item.content),
        category: parseString(item.category),
      });
    }
  }
  return Array.from(unique.values());
}

async function resolveCategoryId(
  category: string | undefined,
  cache: Map<string, string>
): Promise<string | undefined> {
  const name = parseString(category);
  if (!name) return undefined;
  const key = name.toLowerCase();
  const existing = cache.get(key);
  if (existing) return existing;
  const created = await invoke<{ id: string }>("create_category", {
    input: { name, color: "#1a73e8" },
  });
  cache.set(key, created.id);
  return created.id;
}
