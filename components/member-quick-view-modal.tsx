'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Pencil, Trash2, ArrowUpRight } from 'lucide-react';
import { type Member } from '@/data/members';
import { Avatar } from '@/components/yearbook';

interface MemberQuickViewModalProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MemberQuickViewModal({
  member,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: MemberQuickViewModalProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="role px-2 py-0.5 rounded text-[10px] uppercase font-bold" style={{ color: member.color, backgroundColor: `${member.color}15` }}>
              {member.role}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(member);
              }}
              className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--blue)] hover:text-[var(--blue)] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Pencil size={12} /> แก้ไข
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onDelete(member);
              }}
              className="p-1.5 rounded-lg border border-red-500/20 bg-[var(--panel)] hover:bg-red-500/10 text-red-400 transition-colors"
              title="ลบ"
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] transition-colors ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar and Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden border border-[var(--line)] shadow-md">
              <Avatar member={member} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <DialogTitle className="text-3xl font-bold tracking-tight">
                {member.nickname}
                <span style={{ color: member.color }}>.</span>
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-[var(--text)] mt-1">
                {member.fullname}
              </DialogDescription>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)] mt-3 justify-center sm:justify-start font-mono">
                {member.studentId && <span>รหัส: {member.studentId}</span>}
                {member.birthday && <span>วันเกิด: {member.birthday}</span>}
                <span>สาย: {member.category}</span>
              </div>

              {member.quote && (
                <blockquote className="mt-4 text-xs italic text-[var(--blue)] border-l-2 border-[var(--blue)]/40 pl-3 py-1">
                  “{member.quote}”
                </blockquote>
              )}
            </div>
          </div>

          {/* About */}
          {member.about && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                เกี่ยวกับฉัน
              </h4>
              <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">
                {member.about}
              </p>
            </div>
          )}

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                ทักษะและความถนัด
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs rounded-md bg-[var(--panel)] border border-[var(--line)] text-[var(--text)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Social Links */}
          {member.social && Object.entries(member.social).filter(([, url]) => url).length > 0 && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2">
                ช่องทางติดต่อ
              </h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(member.social)
                  .filter(([, url]) => Boolean(url))
                  .map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--blue)] hover:underline inline-flex items-center gap-1 capitalize"
                    >
                      {platform} <ArrowUpRight size={13} />
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
