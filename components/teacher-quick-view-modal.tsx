'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Pencil, Trash2, Mail, MapPin, BookOpen, Quote, Sparkles } from 'lucide-react';
import { type Teacher } from '@/data/teachers';

interface TeacherQuickViewModalProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete: (teacher: Teacher) => void;
}

export function TeacherQuickViewModal({
  teacher,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TeacherQuickViewModalProps) {
  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-2xl">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                color: teacher.color || '#6baaff',
                backgroundColor: `${teacher.color || '#6baaff'}15`,
                borderColor: `${teacher.color || '#6baaff'}30`,
              }}
            >
              {teacher.position}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(teacher);
              }}
              className="px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--blue)] hover:text-[var(--blue)] text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Pencil size={12} /> แก้ไข
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onDelete(teacher);
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
            <div
              className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl overflow-hidden border-2 border-[var(--line)] shadow-lg relative flex items-center justify-center bg-[var(--panel)]"
              style={{ borderColor: `${teacher.color || '#6baaff'}40` }}
            >
              {teacher.image ? (
                <img
                  src={teacher.image}
                  alt={teacher.fullname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center font-bold"
                  style={{ color: teacher.color || '#6baaff' }}
                >
                  <span className="text-4xl">{teacher.fullname.slice(0, 1)}</span>
                  <span className="text-[10px] tracking-widest opacity-60 font-mono mt-1">FACULTY</span>
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              {teacher.academicTitle && (
                <span className="text-xs font-semibold text-[var(--blue)] block mb-1">
                  {teacher.academicTitle}
                </span>
              )}
              <DialogTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
                {teacher.fullname}
              </DialogTitle>
              {teacher.nickname && (
                <DialogDescription className="text-sm font-medium text-[var(--muted)] mt-1">
                  ({teacher.nickname})
                </DialogDescription>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-[var(--muted)] mt-3 justify-center sm:justify-start">
                <span className="px-2 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                  {teacher.position}
                </span>
                <span className="px-2 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                  สาขาวิชาวิทยาการคอมพิวเตอร์
                </span>
              </div>

              {teacher.quote && (
                <blockquote className="mt-4 text-xs italic text-[var(--text)] border-l-2 border-[var(--blue)] pl-3 py-1.5 bg-[var(--panel)]/40 rounded-r-lg">
                  “{teacher.quote}”
                </blockquote>
              )}
            </div>
          </div>

          {/* About / Expertise */}
          {teacher.about && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[var(--blue)]" />
                ความเชี่ยวชาญและบทบาท
              </h4>
              <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">
                {teacher.about}
              </p>
            </div>
          )}

          {/* Courses Taught */}
          {teacher.courses && teacher.courses.length > 0 && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2 flex items-center gap-1.5">
                <BookOpen size={13} className="text-[var(--blue)]" />
                รายวิชาที่สอนในหลักสูตร
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {teacher.courses.map((course) => (
                  <span
                    key={course}
                    className="px-2.5 py-1 text-xs rounded-md bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] font-medium"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact Details */}
          {(teacher.email || teacher.office) && (
            <div className="pt-3 border-t border-[var(--line)]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5">
                ข้อมูลการติดต่อ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {teacher.email && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)]">
                    <Mail size={14} className="text-[var(--blue)] shrink-0" />
                    <a href={`mailto:${teacher.email}`} className="text-[var(--text)] hover:underline truncate">
                      {teacher.email}
                    </a>
                  </div>
                )}
                {teacher.office && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)]">
                    <MapPin size={14} className="text-[var(--blue)] shrink-0" />
                    <span className="text-[var(--text)] truncate">{teacher.office}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
