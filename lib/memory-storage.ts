'use client';

import { memories as defaultMemories } from '@/data/memories';

export type MemoryItem = {
  id: string;
  image: string;
  title: string;
  caption: string;
  album: string;
  albumLabel: string;
  custom?: boolean;
};

const STORAGE_KEY = 'cs66-custom-memories';
const UPDATE_EVENT = 'cs66-memories-updated';

let memoryCache: MemoryItem[] = defaultMemories;
let isInitialized = false;

function loadInitialMemories(): MemoryItem[] {
  if (typeof window === 'undefined') return defaultMemories;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaultMemories;
}

if (typeof window !== 'undefined') {
  memoryCache = loadInitialMemories();
}

export async function syncMemoriesWithApi(): Promise<MemoryItem[]> {
  if (typeof window === 'undefined') return memoryCache;
  try {
    const res = await fetch('/api/memories', { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; data?: MemoryItem[] };
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        memoryCache = json.data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        } catch {}
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: json.data }));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[CS66] Memories sync offline/fallback:', err);
  }
  return memoryCache;
}

function initMemorySyncOnce() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  setTimeout(() => syncMemoriesWithApi(), 50);

  window.addEventListener('focus', () => syncMemoriesWithApi());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncMemoriesWithApi();
  });

  setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncMemoriesWithApi();
    }
  }, 15000);
}

export function getCustomMemories(): MemoryItem[] {
  initMemorySyncOnce();
  return memoryCache.filter((m) => m.custom);
}

export function getAllMemories(): MemoryItem[] {
  initMemorySyncOnce();
  return memoryCache;
}

async function uploadImageIfBase64(imageStr: string): Promise<string> {
  if (!imageStr.startsWith('data:image/')) return imageStr;
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageStr }),
    });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; url?: string };
      if (data.success && data.url) {
        return data.url;
      }
    }
  } catch (err) {
    console.error('Failed to upload memory image:', err);
  }
  return imageStr;
}

export function addCustomMemory(item: Omit<MemoryItem, 'id' | 'custom'>): MemoryItem {
  const id = `custom-mem-${Date.now()}`;

  const newItem: MemoryItem = {
    ...item,
    id,
    custom: true,
  };

  const updated = [newItem, ...memoryCache];
  memoryCache = updated;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: updated }));
  }

  // Persist to SQLite in background
  (async () => {
    try {
      const finalImageUrl = await uploadImageIfBase64(item.image);
      const payload: MemoryItem = { ...newItem, image: finalImageUrl };

      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as { success?: boolean; list?: MemoryItem[] };
        if (data.success && Array.isArray(data.list)) {
          memoryCache = data.list;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.list));
          } catch {}
          window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: data.list }));
        }
      }
    } catch (err) {
      console.error('Failed to save memory to SQLite:', err);
    }
  })();

  return newItem;
}

export function deleteCustomMemory(id: string): boolean {
  const filtered = memoryCache.filter((m) => m.id !== id);
  if (filtered.length === memoryCache.length) return false;

  memoryCache = filtered;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: filtered }));
  }

  fetch(`/api/memories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
    .then((r) => r.json())
    .then((data: any) => {
      if (data && data.success && Array.isArray(data.list)) {
        memoryCache = data.list;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.list));
        } catch {}
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: data.list }));
      }
    })
    .catch((err) => {
      console.error('Failed to delete memory in SQLite:', err);
    });

  return true;
}

export function subscribeToMemories(callback: (items: MemoryItem[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<MemoryItem[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getAllMemories());
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getAllMemories());
    }
  };

  window.addEventListener(UPDATE_EVENT, handleUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}
