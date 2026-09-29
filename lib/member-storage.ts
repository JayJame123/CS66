'use client';

import { members as defaultMembers, type Member } from '@/data/members';

const STORAGE_KEY = 'cs66-custom-members';
const UPDATE_EVENT = 'cs66-members-updated';

let memoryMembersCache: Member[] = defaultMembers;
let isInitialized = false;

function loadInitialCache(): Member[] {
  if (typeof window === 'undefined') return defaultMembers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaultMembers;
}

if (typeof window !== 'undefined') {
  memoryMembersCache = loadInitialCache();
}

/**
 * Fetch latest members from SQLite API on server
 */
export async function syncMembersWithApi(): Promise<Member[]> {
  if (typeof window === 'undefined') return memoryMembersCache;
  try {
    const res = await fetch('/api/members', { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; data?: Member[] };
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        memoryMembersCache = json.data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        } catch {}
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: json.data }));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[CS66] SQLite API sync skipped/offline fallback:', err);
  }
  return memoryMembersCache;
}

function initSyncOnce() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  setTimeout(() => syncMembersWithApi(), 50);

  window.addEventListener('focus', () => syncMembersWithApi());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncMembersWithApi();
  });

  setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncMembersWithApi();
    }
  }, 12000);
}

async function uploadImageIfBase64(imageStr?: string): Promise<string | undefined> {
  if (!imageStr || !imageStr.startsWith('data:image/')) return imageStr;
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
    console.error('Failed to upload image:', err);
  }
  return imageStr;
}

export function getMembers(): Member[] {
  initSyncOnce();
  return memoryMembersCache;
}

export function getMemberById(id: string): Member | undefined {
  const all = getMembers();
  return all.find((m) => m.id === id);
}

export function saveMembers(list: Member[]): void {
  memoryMembersCache = list;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: list }));
  }
}

export async function addMember(newMember: Member): Promise<void> {
  let id = newMember.id?.trim() || '';
  if (!id) {
    id = (newMember.nickname || 'member')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (!id) id = `cs66-${Date.now().toString(36)}`;
  }
  if (memoryMembersCache.some((m) => m.id === id)) {
    id = `${id}-${Date.now().toString(36).slice(-4)}`;
  }

  const imageUrl = await uploadImageIfBase64(newMember.image);

  const memberToAdd: Member = {
    ...newMember,
    id,
    image: imageUrl,
    color: newMember.color || '#6baaff',
    skills: newMember.skills?.filter(Boolean) || [],
    social: newMember.social || {},
  };

  const updated = [memberToAdd, ...memoryMembersCache];
  saveMembers(updated);

  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memberToAdd),
    });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; list?: Member[] };
      if (data.success && Array.isArray(data.list)) {
        saveMembers(data.list);
      }
    }
  } catch (err) {
    console.error('Failed to save member to SQLite server:', err);
  }
}

export async function updateMember(updatedMember: Member): Promise<boolean> {
  const index = memoryMembersCache.findIndex((m) => m.id === updatedMember.id);
  if (index === -1) {
    await addMember(updatedMember);
    return true;
  }

  const imageUrl = await uploadImageIfBase64(updatedMember.image);

  const updatedItem: Member = {
    ...memoryMembersCache[index],
    ...updatedMember,
    image: imageUrl,
    color: updatedMember.color || memoryMembersCache[index].color || '#6baaff',
    skills: updatedMember.skills?.filter(Boolean) || [],
    social: updatedMember.social || {},
  };

  const updatedList = [...memoryMembersCache];
  updatedList[index] = updatedItem;
  saveMembers(updatedList);

  try {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; list?: Member[] };
      if (data.success && Array.isArray(data.list)) {
        saveMembers(data.list);
      }
    }
  } catch (err) {
    console.error('Failed to update member in SQLite server:', err);
  }

  return true;
}

export async function deleteMember(id: string): Promise<boolean> {
  const filtered = memoryMembersCache.filter((m) => m.id !== id);
  if (filtered.length === memoryMembersCache.length) return false;

  saveMembers(filtered);

  try {
    const res = await fetch(`/api/members/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; list?: Member[] };
      if (data.success && Array.isArray(data.list)) {
        saveMembers(data.list);
      }
    }
  } catch (err) {
    console.error('Failed to delete member in SQLite server:', err);
  }

  return true;
}

export async function resetMembers(): Promise<void> {
  try {
    const res = await fetch('/api/members/reset', { method: 'POST' });
    if (res.ok) {
      const data = (await res.json()) as { success?: boolean; data?: Member[] };
      if (data.success && Array.isArray(data.data)) {
        saveMembers(data.data);
        return;
      }
    }
  } catch (err) {
    console.error('Failed to reset in SQLite server:', err);
  }
  saveMembers(defaultMembers);
}

export function exportMembersJson(): string {
  const current = getMembers();
  return JSON.stringify(current, null, 2);
}

export function importMembersJson(
  jsonStr: string
): { success: boolean; count?: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, error: 'ข้อมูลต้องเป็นรายการ (Array)' };
    }
    const validated: Member[] = parsed.map((item: unknown, idx: number) => {
      const m = (typeof item === 'object' && item !== null ? item : {}) as Record<string, unknown>;
      return {
        id: String(m.id || `member-${idx + 1}`).trim(),
        nickname: String(m.nickname || 'เพื่อน CS66').trim(),
        fullname: String(m.fullname || '').trim(),
        studentId: String(m.studentId || '').trim(),
        role: String(m.role || 'สมาชิก CS66').trim(),
        category: String(m.category || 'Frontend').trim(),
        quote: String(m.quote || '').trim(),
        skills: Array.isArray(m.skills) ? m.skills.map(String) : [],
        color: String(m.color || '#6baaff').trim(),
        about: String(m.about || '').trim(),
        social: typeof m.social === 'object' && m.social ? (m.social as Record<string, string>) : {},
        image: m.image ? String(m.image) : undefined,
        imageFit: m.imageFit === 'contain' ? 'contain' : 'cover',
        birthday: m.birthday ? String(m.birthday) : undefined,
      };
    });

    saveMembers(validated);

    for (const mem of validated) {
      fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mem),
      }).catch(() => {});
    }

    return { success: true, count: validated.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'รูปแบบ JSON ไม่ถูกต้อง';
    return { success: false, error: errorMsg };
  }
}

export function generateMembersTsCode(membersList?: Member[]): string {
  const list = membersList || getMembers();
  const json = JSON.stringify(list, null, 2);

  const catSet = new Set(['All', 'Frontend', 'Backend', 'Designer', 'Gamer', 'AI', 'Database']);
  list.forEach((m) => {
    if (m.category && m.category.trim()) catSet.add(m.category.trim());
  });
  const catArray = JSON.stringify(Array.from(catSet));

  return `export type Member = {
  id: string;
  nickname: string;
  fullname: string;
  studentId: string;
  role: string;
  category: string;
  quote: string;
  skills: string[];
  color: string;
  about: string;
  social: {
    github?: string;
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  image?: string;
  imageFit?: 'cover' | 'contain';
  birthday?: string;
};

export const classSize = ${Math.max(list.length, 20)};
export const members: Member[] = ${json};

export const categories = ${catArray};
export const categoryLabels: Record<string, string> = {
  All: 'ทั้งหมด',
  Frontend: 'สายหน้าบ้าน',
  Backend: 'สายหลังบ้าน',
  Designer: 'สายออกแบบ',
  Gamer: 'สายเกม',
  AI: 'สาย AI',
  Database: 'สายฐานข้อมูล',
};
`;
}

export function subscribeToMembers(callback: (members: Member[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = (e: Event) => {
    const custom = e as CustomEvent<Member[]>;
    if (custom.detail) {
      callback(custom.detail);
    } else {
      callback(getMembers());
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback(getMembers());
    }
  };

  window.addEventListener(UPDATE_EVENT, handleUpdate);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(UPDATE_EVENT, handleUpdate);
    window.removeEventListener('storage', handleStorage);
  };
}
