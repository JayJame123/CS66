'use client';

import { members as defaultMembers, type Member } from '@/data/members';

const STORAGE_KEY = 'cs66-custom-members';
const UPDATE_EVENT = 'cs66-members-updated';

/**
 * Get the list of members from localStorage if available,
 * otherwise returns the default members list from data/members.ts.
 */
export function getMembers(): Member[] {
  if (typeof window === 'undefined') return defaultMembers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMembers;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to parse members from localStorage', err);
  }
  return defaultMembers;
}

/**
 * Get a single member by id
 */
export function getMemberById(id: string): Member | undefined {
  const all = getMembers();
  return all.find((m) => m.id === id);
}

/**
 * Save member list to localStorage and dispatch update event
 */
export function saveMembers(list: Member[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: list }));
  } catch (err) {
    console.error('Failed to save members to localStorage', err);
  }
}

/**
 * Add a new member
 */
export function addMember(newMember: Member): void {
  const current = getMembers();
  // Ensure unique ID
  let id = newMember.id?.trim() || '';
  if (!id) {
    id = (newMember.nickname || 'member')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    if (!id) id = `cs66-${Date.now().toString(36)}`;
  }
  // If id collisions, append timestamp
  if (current.some((m) => m.id === id)) {
    id = `${id}-${Date.now().toString(36).slice(-4)}`;
  }

  const memberToAdd: Member = {
    ...newMember,
    id,
    color: newMember.color || '#6baaff',
    skills: newMember.skills?.filter(Boolean) || [],
    social: newMember.social || {},
  };

  const updated = [memberToAdd, ...current];
  saveMembers(updated);
}

/**
 * Update an existing member
 */
export function updateMember(updatedMember: Member): boolean {
  const current = getMembers();
  const index = current.findIndex((m) => m.id === updatedMember.id);
  if (index === -1) {
    // If not found, add it
    addMember(updatedMember);
    return true;
  }
  const updatedList = [...current];
  updatedList[index] = {
    ...updatedList[index],
    ...updatedMember,
    color: updatedMember.color || updatedList[index].color || '#6baaff',
    skills: updatedMember.skills?.filter(Boolean) || [],
    social: updatedMember.social || {},
  };
  saveMembers(updatedList);
  return true;
}

/**
 * Delete a member by id
 */
export function deleteMember(id: string): boolean {
  const current = getMembers();
  const filtered = current.filter((m) => m.id !== id);
  if (filtered.length === current.length) return false;
  saveMembers(filtered);
  return true;
}

/**
 * Reset members back to default demo data
 */
export function resetMembers(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: defaultMembers }));
  } catch (err) {
    console.error('Failed to reset members in localStorage', err);
  }
}

/**
 * Export current members as formatted JSON string
 */
export function exportMembersJson(): string {
  const current = getMembers();
  return JSON.stringify(current, null, 2);
}

/**
 * Import members from JSON string
 */
export function importMembersJson(jsonStr: string): { success: boolean; count?: number; error?: string } {
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
    return { success: true, count: validated.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'รูปแบบ JSON ไม่ถูกต้อง';
    return { success: false, error: errorMsg };
  }
}

/**
 * Generate TypeScript code for data/members.ts
 */
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

/**
 * Helper to subscribe to member changes in React
 */
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
