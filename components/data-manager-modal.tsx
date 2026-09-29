'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Database, Copy, Check, Download, Upload, RotateCcw, X, FileCode } from 'lucide-react';
import { type Member } from '@/data/members';
import {
  exportMembersJson,
  importMembersJson,
  generateMembersTsCode,
  resetMembers,
} from '@/lib/member-storage';

interface DataManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  onDataChanged: () => void;
}

export function DataManagerModal({
  open,
  onOpenChange,
  members,
  onDataChanged,
}: DataManagerModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyCode = async () => {
    try {
      const code = generateMembersTsCode(members);
      await navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      setImportStatus('ไม่สามารถคัดลอกได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleExportJson = () => {
    const json = exportMembersJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cs66-members-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importMembersJson(content);
        if (res.success) {
          setImportStatus(`นำเข้าสำเร็จ ${res.count} คน`);
          onDataChanged();
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus(`เกิดข้อผิดพลาด: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลตัวอย่างเริ่มต้นใช่หรือไม่?')) {
      resetMembers();
      onDataChanged();
      setImportStatus('รีเซ็ตข้อมูลเป็นค่าเริ่มต้นเรียบร้อยแล้ว');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--blue)]/10 text-[var(--blue)]">
              <Database size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">จัดการและสำรองข้อมูลสมาชิก</DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted)]">
                ข้อมูลปัจจุบันมีสมาชิก {members.length} คน
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

        {importStatus && (
          <div className="p-3 my-3 rounded-lg bg-[var(--blue)]/15 border border-[var(--blue)]/30 text-xs text-[var(--blue)] font-medium">
            {importStatus}
          </div>
        )}

        <div className="space-y-4 my-4">
          {/* Copy TypeScript code */}
          <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <FileCode size={16} className="text-[var(--blue)]" /> คัดลอกโค้ดสำหรับ data/members.ts
              </h4>
              <p className="text-xs text-[var(--muted)] mt-1">
                นำโค้ดไปวางในไฟล์ <code>data/members.ts</code> เพื่อบันทึกเป็นข้อมูลถาวรในโปรเจกต์
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3.5 py-2 rounded-lg bg-[#93bfff] text-[#090f1b] hover:bg-[#b0d0ff] text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
            >
              {copiedCode ? (
                <>
                  <Check size={14} className="text-green-800" /> คัดลอกแล้ว!
                </>
              ) : (
                <>
                  <Copy size={14} /> คัดลอกโค้ด TS
                </>
              )}
            </button>
          </div>

          {/* Export / Import JSON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--blue)]/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2 text-sm font-semibold group-hover:text-[var(--blue)]">
                <Download size={16} /> ส่งออก JSON
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-1.5">
                ดาวน์โหลดไฟล์ข้อมูลสำรองไว้ส่งต่อให้เพื่อนหรือย้ายเครื่อง
              </p>
            </button>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--blue)]/50 text-left transition-all group"
              >
                <div className="flex items-center gap-2 text-sm font-semibold group-hover:text-[var(--blue)]">
                  <Upload size={16} /> นำเข้า JSON
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-1.5">
                  เลือกไฟล์ JSON ที่เพื่อนหรือเครื่องอื่นส่งมาเพื่อโหลดข้อมูล
                </p>
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 hover:bg-red-500/10 text-red-400 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <RotateCcw size={14} /> กู้คืนข้อมูลตัวอย่างเริ่มต้น (Reset)
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--panel)] text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
