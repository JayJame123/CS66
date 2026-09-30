'use client';

import { defaultTeachers, type Teacher } from '@/data/teachers';

const STORAGE_KEY = 'cs66-custom-teachers';
const UPDATE_EVENT = 'cs66-teachers-updated';

let teacherCache: Teacher[] = defaultTeachers;

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
  return updatedTeacher;
}

export function deleteTeacher(id: string): boolean {
  const current = getTeachers();
  const updated = current.filter((t) => t.id !== id);
  if (updated.length === current.length) return false;
  persistTeachers(updated);
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
