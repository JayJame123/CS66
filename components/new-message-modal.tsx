'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Heart, Send, X, Sparkles, User, Users } from 'lucide-react';
import { type Member } from '@/data/members';
import { addMessage, type FriendMessage } from '@/lib/message-storage';

interface NewMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  initialReceiverId?: string;
  onSuccess?: (message: FriendMessage) => void;
}

const TAG_PRESETS = [
  '// friends for life',
  '// best chapter ever',
  '// friendship.status = 200',
  '// keep in touch',
  '// miss you all',
  '// see you at graduation',
];

export function NewMessageModal({
  open,
  onOpenChange,
  members,
  initialReceiverId = 'all',
  onSuccess,
}: NewMessageModalProps) {
  const [receiverId, setReceiverId] = useState<string>(initialReceiverId);
  const [senderName, setSenderName] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [tag, setTag] = useState<string>('// friends for life');
  const [isCustomTag, setIsCustomTag] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReceiverId(initialReceiverId || 'all');
      setError(null);
    }
  }, [open, initialReceiverId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      setError('กรุณาระบุชื่อของคุณ');
      return;
    }
    if (!content.trim()) {
      setError('กรุณาเขียนข้อความที่ต้องการฝาก');
      return;
    }

    setIsSubmitting(true);

    try {
      let receiverName = 'ทุกคนใน CS66';
      let color = '#6baaff';

      if (receiverId !== 'all') {
        const found = members.find((m) => m.id === receiverId);
        if (found) {
          receiverName = found.nickname || found.fullname;
          color = found.color || '#6baaff';
        }
      }

      const newMsg = addMessage({
        senderName: senderName.trim(),
        receiverId,
        receiverName,
        content: content.trim(),
        tag: tag.trim() || '// friends for life',
        color,
      });

      setContent('');
      onSuccess?.(newMsg);
      onOpenChange(false);
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกข้อความ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 flex items-center justify-center text-[var(--blue)]">
              <Heart size={16} className="fill-[var(--blue)]/30" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">ฝากข้อความถึงเพื่อน</DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted)]">
                ส่งความในใจ คำอวยพร หรือเรื่องที่อยากบอกเพื่อนในรุ่น
              </DialogDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Recipient Selector */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[var(--text)] flex items-center gap-1.5">
              <Users size={14} className="text-[var(--blue)]" />
              อยากฝากข้อความถึงใคร? <span className="text-red-400">*</span>
            </label>
            <select
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[var(--bg)] text-[var(--text)] font-semibold">
                👥 ถึงเพื่อนทุกคนใน CS66 (Public)
              </option>
              <optgroup label="── เลือกเพื่อนรายคน ──" className="bg-[var(--bg)] text-[var(--muted)]">
                {members.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[var(--bg)] text-[var(--text)]">
                    {m.nickname ? `👤 ${m.nickname} (${m.fullname})` : `👤 ${m.fullname}`}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block text-xs font-semibold mb-1.5 text-[var(--text)] flex items-center gap-1.5">
              <User size={14} className="text-[var(--blue)]" />
              ชื่อของคุณ (ผู้ฝาก) <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="เช่น เจมส์, แบงค์, หรือนามแฝง..."
              className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text)]">
                ข้อความที่อยากบอก <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-[var(--muted)]">{content.length}/500</span>
            </div>
            <textarea
              required
              rows={4}
              maxLength={500}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนความในใจ คำขอบคุณ คำอวยพร หรือเรื่องประทับใจตอนเรียนด้วยกัน..."
              className="w-full p-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors resize-none"
            />
          </div>

          {/* Tag Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1">
                <Sparkles size={12} className="text-[var(--blue)]" /> สไตล์ Tag ข้อความ
              </label>
              <button
                type="button"
                onClick={() => setIsCustomTag(!isCustomTag)}
                className="text-[11px] text-[var(--blue)] hover:underline"
              >
                {isCustomTag ? '← เลือกจากรายการ' : '+ พิมพ์ Tag เอง'}
              </button>
            </div>

            {!isCustomTag ? (
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                      tag === t
                        ? 'bg-[var(--blue)] text-[#090f1b] font-semibold shadow-sm'
                        : 'bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="เช่น // see you next time"
                className="w-full h-9 px-3 text-xs font-mono rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[var(--line)] flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--blue)] hover:opacity-90 text-[#090f1b] flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <Send size={13} />
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งข้อความถึงเพื่อน'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
