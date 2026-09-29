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

export function getCustomMemories(): MemoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    console.error('Failed to parse custom memories from localStorage', err);
  }
  return [];
}

export function getAllMemories(): MemoryItem[] {
  const custom = getCustomMemories();
  if (custom.length === 0) return defaultMemories;
  // Prepend custom photos so latest added show first
  return [...custom, ...defaultMemories];
}

export function addCustomMemory(item: Omit<MemoryItem, 'id' | 'custom'>): MemoryItem {
  const custom = getCustomMemories();
  const id = `custom-mem-${Date.now()}`;
  const newItem: MemoryItem = {
    ...item,
    id,
    custom: true,
  };
  const updated = [newItem, ...custom];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: getAllMemories() }));
  } catch (err) {
    console.error('Failed to save custom memory to localStorage', err);
  }
  return newItem;
}

export function deleteCustomMemory(id: string): boolean {
  const custom = getCustomMemories();
  const filtered = custom.filter((m) => m.id !== id);
  if (filtered.length === custom.length) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: getAllMemories() }));
  } catch (err) {
    console.error('Failed to delete custom memory from localStorage', err);
  }
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
