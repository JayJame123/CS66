'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heart, Plus, MessageSquareHeart, Users, User, Trash2, Filter } from 'lucide-react';
import { type Member } from '@/data/members';
import {
  getMessages,
  deleteMessage,
  likeMessage,
  subscribeMessages,
  type FriendMessage,
} from '@/lib/message-storage';
import { NewMessageModal } from '@/components/new-message-modal';

interface FriendMessagesProps {
  members: Member[];
}

export function FriendMessages({ members }: FriendMessagesProps) {
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all-filter'); // 'all-filter' | 'to-all' | member.id
  const [modalOpen, setModalOpen] = useState(false);
  const [preselectedReceiverId, setPreselectedReceiverId] = useState<string>('all');
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMessages(getMessages());
    const unsubscribe = subscribeMessages((updated) => {
      setMessages(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleLike = (id: string) => {
    likeMessage(id);
    setLikedMap((prev) => ({ ...prev, [id]: true }));
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) {
      deleteMessage(id);
    }
  };

  const openNewMessage = (receiverId: string = 'all') => {
    setPreselectedReceiverId(receiverId);
    setModalOpen(true);
  };

  const filteredMessages = useMemo(() => {
    if (selectedFilter === 'all-filter') return messages;
    if (selectedFilter === 'to-all') return messages.filter((m) => m.receiverId === 'all');
    return messages.filter((m) => m.receiverId === selectedFilter);
  }, [messages, selectedFilter]);

  // Find member map for quick nickname lookup
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => map.set(m.id, m));
    return map;
  }, [members]);

  const selectedMember = selectedFilter !== 'all-filter' && selectedFilter !== 'to-all'
    ? memberMap.get(selectedFilter)
    : null;

  return (
    <section id="message" className="section container">
      <div className="section-heading flex-wrap gap-4 items-end justify-between">
        <div>
          <div className="section-kicker">05 — ข้อความที่อยากเก็บไว้</div>
          <h2 className="section-title">
            ฝากข้อความ<span>ถึงเพื่อน</span>
          </h2>
          <p className="muted">บางข้อความ เก็บไว้ในใจได้ตลอดไป · ร่วมส่งความในใจถึงเพื่อนในรุ่น</p>
        </div>

        <button
          type="button"
          onClick={() => openNewMessage('all')}
          className="add-member-button shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <MessageSquareHeart size={16} />
          ฝากข้อความถึงเพื่อน
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 pt-1 border-b border-[var(--line)] mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedFilter('all-filter')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedFilter === 'all-filter'
                ? 'bg-[var(--blue)] text-[#090f1b] font-semibold shadow-sm'
                : 'bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            ข้อความทั้งหมด ({messages.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedFilter('to-all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedFilter === 'to-all'
                ? 'bg-[var(--blue)] text-[#090f1b] font-semibold shadow-sm'
                : 'bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            👥 ถึงทุกคนในรุ่น ({messages.filter((m) => m.receiverId === 'all').length})
          </button>
        </div>

        {/* Member Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted)] flex items-center gap-1">
            <Filter size={13} /> ดูข้อความถึง:
          </span>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] text-[var(--text)] cursor-pointer"
          >
            <option value="all-filter">── ทั้งหมด ──</option>
            <option value="to-all">👥 ถึงทุกคนใน CS66</option>
            <optgroup label="── เพื่อนรายคน ──">
              {members.map((m) => {
                const count = messages.filter((msg) => msg.receiverId === m.id).length;
                return (
                  <option key={m.id} value={m.id}>
                    {m.nickname || m.fullname} {count > 0 ? `(${count})` : ''}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Messages Grid */}
      {filteredMessages.length > 0 ? (
        <div className="wall">
          {filteredMessages.map((note, i) => {
            const isToAll = note.receiverId === 'all';
            const isLiked = likedMap[note.id];
            const receiverMember = !isToAll ? memberMap.get(note.receiverId) : null;
            const targetName = receiverMember
              ? receiverMember.nickname || receiverMember.fullname
              : note.receiverName || 'ทุกคนใน CS66';

            return (
              <article key={note.id} className={`wall-note note-${i % 3}`}>
                <span className="quote-symbol">“</span>

                {/* Recipient Badge */}
                <div className="mb-3">
                  {isToAll ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20">
                      <Users size={11} /> ถึงเพื่อนทุกคนใน CS66
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
                      style={{
                        backgroundColor: `${note.color || '#6baaff'}15`,
                        borderColor: `${note.color || '#6baaff'}30`,
                        color: note.color || '#6baaff',
                      }}
                    >
                      <Heart size={11} /> ถึง: {targetName}
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="whitespace-pre-wrap">{note.content}</p>

                {/* Sender & Meta */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="note-initial flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: `${note.color || '#6baaff'}20`,
                        color: note.color || '#6baaff',
                      }}
                    >
                      {note.senderName.slice(0, 1)}
                    </span>
                    <div>
                      <strong className="block text-xs font-semibold">{note.senderName}</strong>
                      <small className="text-[10px] text-[var(--muted)]">
                        {new Date(note.createdAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </small>
                    </div>
                  </div>

                  {/* Actions: Like & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleLike(note.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-transform active:scale-125 cursor-pointer ${
                        isLiked
                          ? 'text-red-400 font-semibold'
                          : 'text-[var(--muted)] hover:text-red-400'
                      }`}
                      title="กดถูกใจข้อความ"
                    >
                      <Heart
                        size={15}
                        className={isLiked ? 'fill-red-400 stroke-red-400' : ''}
                      />
                      <span>{note.likes || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="p-1 rounded text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-40 hover:opacity-100"
                      title="ลบข้อความนี้"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Code Tag */}
                {note.tag && <code className="mt-2 block">{note.tag}</code>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state py-16 text-center border border-dashed border-[var(--line)] rounded-xl">
          <MessageSquareHeart size={36} className="mx-auto text-[var(--muted)] mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-[var(--text)]">
            {selectedMember
              ? `ยังไม่มีข้อความถึง ${selectedMember.nickname || selectedMember.fullname}`
              : 'ยังไม่มีข้อความในหมวดนี้'}
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1 mb-4">
            {selectedMember
              ? `เป็นคนแรกที่ส่งความในใจหรือคำอวยพรถึง ${selectedMember.nickname || selectedMember.fullname}`
              : 'เขียนข้อความแรกเพื่อบันทึกไว้ในสมุดความทรงจำ CS66'}
          </p>
          <button
            type="button"
            onClick={() => openNewMessage(selectedFilter !== 'all-filter' ? selectedFilter : 'all')}
            className="add-member-button mx-auto"
          >
            <Plus size={15} /> เขียนข้อความ
          </button>
        </div>
      )}

      {/* Modal */}
      <NewMessageModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        members={members}
        initialReceiverId={preselectedReceiverId}
        onSuccess={() => {
          setMessages(getMessages());
        }}
      />
    </section>
  );
}
