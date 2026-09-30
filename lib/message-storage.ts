'use client';

export interface FriendMessage {
  id: string;
  senderName: string;
  receiverId: string; // 'all' or member.id (e.g. 'jame')
  receiverName: string; // 'ทุกคนใน CS66' or 'จารย์เจมส์'
  content: string;
  tag?: string;
  createdAt: string; // ISO string
  likes: number;
  color?: string;
}

const STORAGE_KEY = 'cs66-friend-messages';
const UPDATE_EVENT = 'cs66-messages-updated';

export const defaultMessages: FriendMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Jame',
    receiverId: 'all',
    receiverName: 'ทุกคนใน CS66',
    content: 'ขอบคุณที่ช่วยกันแก้ Bug ทั้งในโค้ดและในชีวิต ไว้มาเขียนโปรเจกต์ด้วยกันอีกนะ',
    tag: '// friends for life',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    likes: 12,
    color: '#6baaff',
  },
  {
    id: 'msg-2',
    senderName: 'Mint',
    receiverId: 'all',
    receiverName: 'ทุกคนใน CS66',
    content: 'จากคนแปลกหน้า กลายเป็นคนที่อยู่ในทุกความทรงจำดี ๆ ขอบคุณสำหรับ 4 ปีนี้นะ',
    tag: '// best chapter ever',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    likes: 9,
    color: '#bd9aff',
  },
  {
    id: 'msg-3',
    senderName: 'Bank',
    receiverId: 'all',
    receiverName: 'ทุกคนใน CS66',
    content: 'โค้ดอาจจะ Error แต่ความเป็นเพื่อนของเราไม่มีวันพัง อย่าลืม CS66 นะทุกคน',
    tag: '// friendship.status = 200',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    likes: 15,
    color: '#68cfbb',
  },
  {
    id: 'msg-4',
    senderName: 'Golf',
    receiverId: 'jame',
    receiverName: 'จารย์เจมส์',
    content: 'ขอบคุณจารย์เจมส์ที่คอยแบกวิชา Web App และช่วยสอน React มาตลอด จารย์เก่งมาก!',
    tag: '// best mentor',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    likes: 8,
    color: '#f6ad55',
  },
];

let messageCache: FriendMessage[] = defaultMessages;

function loadInitialMessages(): FriendMessage[] {
  if (typeof window === 'undefined') return defaultMessages;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaultMessages;
}

if (typeof window !== 'undefined') {
  messageCache = loadInitialMessages();
}

function persistMessages(messages: FriendMessage[]) {
  messageCache = messages;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: messages }));
  } catch (err) {
    console.warn('[CS66] Failed to save messages to localStorage:', err);
  }
}

export function getMessages(): FriendMessage[] {
  if (typeof window === 'undefined') return messageCache;
  messageCache = loadInitialMessages();
  return messageCache;
}

export function addMessage(data: {
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  tag?: string;
  color?: string;
}): FriendMessage {
  const current = getMessages();
  const newMessage: FriendMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    senderName: data.senderName.trim() || 'เพื่อนนิรนาม',
    receiverId: data.receiverId || 'all',
    receiverName: data.receiverName || 'ทุกคนใน CS66',
    content: data.content.trim(),
    tag: data.tag?.trim() || '// cs66 memories',
    createdAt: new Date().toISOString(),
    likes: 0,
    color: data.color || '#6baaff',
  };

  const updated = [newMessage, ...current];
  persistMessages(updated);
  return newMessage;
}

export function deleteMessage(id: string): boolean {
  const current = getMessages();
  const updated = current.filter((m) => m.id !== id);
  if (updated.length === current.length) return false;
  persistMessages(updated);
  return true;
}

export function likeMessage(id: string): number {
  const current = getMessages();
  let newLikes = 0;
  const updated = current.map((m) => {
    if (m.id === id) {
      newLikes = (m.likes || 0) + 1;
      return { ...m, likes: newLikes };
    }
    return m;
  });
  persistMessages(updated);
  return newLikes;
}

export function getMessagesForReceiver(receiverId: string): FriendMessage[] {
  const messages = getMessages();
  if (receiverId === 'all') {
    return messages.filter((m) => m.receiverId === 'all');
  }
  return messages.filter((m) => m.receiverId === receiverId);
}

export function resetMessages(): void {
  persistMessages(defaultMessages);
}

export function subscribeMessages(callback: (messages: FriendMessage[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const custom = e as CustomEvent<FriendMessage[]>;
    callback(custom.detail || getMessages());
  };
  window.addEventListener(UPDATE_EVENT, handler);
  return () => window.removeEventListener(UPDATE_EVENT, handler);
}
