'use client';

import { defaultTeachers, type Teacher } from '@/data/teachers';

const STORAGE_KEY = 'cs66-custom-teachers';
const UPDATE_EVENT = 'cs66-teachers-updated';

let teacherCache: Teacher[] = defaultTeachers;
let isInitialized = false;

function loadInitialTeachers(): Teacher[] {
  if (typeof window === 'undefined') return defaultTeachers;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaultTeachers;
}

if (typeof window !== 'undefined') {
  teacherCache = loadInitialTeachers();
}

export async function syncTeachersWithApi(): Promise<Teacher[]> {
  if (typeof window === 'undefined') return teacherCache;
  try {
    const res = await fetch('/api/teachers', { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; data?: Teacher[] };
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        teacherCache = json.data;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        } catch {}
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: json.data }));
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[CS66] Teachers API sync skipped/offline fallback:', err);
  }
  return teacherCache;
}

function initSyncOnce() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;
  setTimeout(() => syncTeachersWithApi(), 80);
  window.addEventListener('focus', () => syncTeachersWithApi());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncTeachersWithApi();
  });
}

function persistTeachers(teachers: Teacher[]) {
  teacherCache = teachers;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(teachers));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: teachers }));
  } catch (err) {
    console.warn('[CS66] Failed to save teachers to localStorage:', err);
  }
}

export function getTeachers(): Teacher[] {
  initSyncOnce();
  if (typeof window === 'undefined') return teacherCache;
  teacherCache = loadInitialTeachers();
  return teacherCache;
}

export function addTeacher(data: Omit<Teacher, 'id'>): Teacher {
  const current = getTeachers();
  const newId = `teacher-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const newTeacher: Teacher = {
    ...data,
    id: newId,
    custom: true,
  };
  const updated = [...current, newTeacher];
  persistTeachers(updated);

  // Sync to PostgreSQL
  if (typeof window !== 'undefined') {
    fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.list && Array.isArray(data.list)) {
          persistTeachers(data.list);
        }
      })
      .catch((err) => console.warn('[CS66] Failed to sync new teacher to server:', err));
  }

  return newTeacher;
}

export function updateTeacher(id: string, updates: Partial<Teacher>): Teacher | null {
  const current = getTeachers();
  const index = current.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedTeacher: Teacher = {
    ...current[index],
    ...updates,
    id,
  };
  const updated = [...current];
  updated[index] = updatedTeacher;
  persistTeachers(updated);

  // Sync to PostgreSQL
  if (typeof window !== 'undefined') {
    fetch('/api/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTeacher),
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.list && Array.isArray(data.list)) {
          persistTeachers(data.list);
        }
      })
      .catch((err) => console.warn('[CS66] Failed to sync updated teacher to server:', err));
  }

  return updatedTeacher;
}

export function deleteTeacher(id: string): boolean {
  const current = getTeachers();
  const updated = current.filter((t) => t.id !== id);
  if (updated.length === current.length) return false;
  persistTeachers(updated);

  // Sync delete to PostgreSQL
  if (typeof window !== 'undefined') {
    fetch(`/api/teachers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.list && Array.isArray(data.list)) {
          persistTeachers(data.list);
        }
      })
      .catch((err) => console.warn('[CS66] Failed to delete teacher on server:', err));
  }

  return true;
}

export function resetTeachers(): void {
  persistTeachers(defaultTeachers);
}

export function subscribeToTeachers(callback: (teachers: Teacher[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<Teacher[]>;
    callback(custom.detail || getTeachers());
  };
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
}
