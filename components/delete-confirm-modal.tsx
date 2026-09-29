'use client';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { type Member } from '@/data/members';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onConfirm: (id: string) => void;
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  member,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-xl">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-red-400">
              ยืนยันการลบโปรไฟล์?
            </DialogTitle>
            <DialogDescription className="text-sm text-[var(--muted)] mt-2 leading-relaxed">
              คุณต้องการลบโปรไฟล์ของ{' '}
              <strong className="text-[var(--text)] font-semibold">
                &ldquo;{member.nickname}&rdquo; ({member.fullname})
              </strong>{' '}
              ออกจากทำเนียบรุ่นหรือไม่?
            </DialogDescription>
            <p className="text-xs text-[var(--muted)] mt-2 opacity-80">
              *ข้อมูลจะถูกลบออกจากเครื่องนี้ หากต้องการนำกลับมา สามารถกดรีเซ็ตเป็นข้อมูลเริ่มต้นได้ทุกเมื่อ
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--panel)] text-sm transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(member.id);
              onOpenChange(false);
            }}
            className="px-5 py-2 rounded-lg bg-red-500/90 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Trash2 size={15} /> ลบโปรไฟล์
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
