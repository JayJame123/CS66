'use client';

import { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, Upload, Trash2, Camera, Sparkles, Plus, ChevronDown, ArrowLeft } from 'lucide-react';
import { albums } from '@/data/memories';
import { addCustomMemory, getAllMemories, type MemoryItem } from '@/lib/memory-storage';

interface UploadMemoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (memory: MemoryItem) => void;
  defaultAlbum?: string;
}

export function UploadMemoryModal({
  open,
  onOpenChange,
  onSuccess,
  defaultAlbum = 'first-year',
}: UploadMemoryModalProps) {
  const [image, setImage] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState(defaultAlbum === 'all' ? 'first-year' : defaultAlbum);
  const [isCustomAlbum, setIsCustomAlbum] = useState(false);
  const [customAlbumInput, setCustomAlbumInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const availableAlbums = useMemo(() => {
    const map = new Map<string, string>();
    albums.filter((a) => a.id !== 'all').forEach((a) => map.set(a.id, a.label));
    try {
      const all = getAllMemories();
      all.forEach((m) => {
        if (m.album && m.albumLabel && m.album !== 'all') {
          map.set(m.album, m.albumLabel);
        }
      });
    } catch {}
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [open]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 3MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImage(event.target.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    e.preventDefault();
    if (!image) {
      setError('กรุณาเลือกรูปภาพที่ต้องการอัปโหลด');
      return;
    }
    if (!title.trim()) {
      setError('กรุณาตั้งชื่อภาพความทรงจำ');
      return;
    }

    let albumId = selectedAlbum;
    let albumLabel = '';

    if (isCustomAlbum) {
      if (!customAlbumInput.trim()) {
        setError('กรุณาระบุชื่ออัลบั้มใหม่');
        return;
      }
      albumLabel = customAlbumInput.trim();
      albumId = `album-${Date.now()}`;
    } else {
      const albumObj = availableAlbums.find((a) => a.id === selectedAlbum);
      albumLabel = albumObj?.label || 'ความทรงจำ CS66';
    }

    setIsSubmitting(true);

    try {
      const newMemory = addCustomMemory({
        image,
        title: title.trim(),
        caption: caption.trim() || 'ภาพความทรงจำดี ๆ ของเพื่อน CS66',
        album: albumId,
        albumLabel,
      });

      onSuccess?.(newMemory);
      onOpenChange(false);
      // Reset form
      setImage('');
      setTitle('');
      setCaption('');
      setIsCustomAlbum(false);
      setCustomAlbumInput('');
      setError(null);
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึกภาพ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[var(--blue)]" />
            <DialogTitle className="text-lg font-bold">อัปโหลดภาพกิจกรรมใหม่</DialogTitle>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <DialogDescription className="text-xs text-[var(--muted)]">
            เพิ่มภาพถ่ายกิจกรรมลงในแกลเลอรีความทรงจำของรุ่น CS66
          </DialogDescription>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold mb-2">
              รูปภาพกิจกรรม <span className="text-red-400">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {image ? (
              <div className="relative rounded-xl overflow-hidden border border-[var(--line)] bg-[var(--panel)] group">
                <img src={image} alt="Preview" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Upload size={13} /> เปลี่ยนรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="p-1.5 rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                    title="ลบรูป"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-44 border-2 border-dashed border-[var(--line)] hover:border-[var(--blue)]/50 rounded-xl flex flex-col items-center justify-center gap-2 bg-[var(--panel)] hover:bg-[var(--line)]/30 transition-all cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--blue)]/10 text-[var(--blue)] flex items-center justify-center">
                  <Upload size={22} />
                </div>
                <span className="text-sm font-medium">คลิกเพื่อเลือกรูปภาพจากเครื่อง</span>
                <span className="text-xs text-[var(--muted)]">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 3MB</span>
              </button>
            )}
          </div>

          {/* Album Selector */}
          <div>
            <div className="flex items-center justify-between h-6 mb-1.5">
              <label className="text-xs font-semibold text-[var(--text)] whitespace-nowrap">
                อัลบั้มที่ต้องการจัดเก็บ <span className="text-red-400">*</span>
              </label>
              {!isCustomAlbum && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomAlbum(true);
                    setCustomAlbumInput('');
                  }}
                  className="text-xs text-[var(--blue)] hover:text-white hover:bg-[var(--blue)]/20 px-2.5 py-0.5 rounded-full border border-[var(--blue)]/30 transition-all flex items-center gap-1 font-medium whitespace-nowrap shrink-0"
                  style={{ fontSize: '11px', lineHeight: '14px' }}
                >
                  <Plus size={11} /> เพิ่มอัลบั้มใหม่
                </button>
              )}
            </div>

            {!isCustomAlbum ? (
              <div className="relative">
                <select
                  value={selectedAlbum}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setIsCustomAlbum(true);
                      setCustomAlbumInput('');
                    } else {
                      setSelectedAlbum(e.target.value);
                    }
                  }}
                  className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors pr-9 appearance-none cursor-pointer"
                >
                  {availableAlbums.map((a) => (
                    <option key={a.id} value={a.id} className="bg-[var(--bg)] text-[var(--text)]">
                      {a.label}
                    </option>
                  ))}
                  <option value="__custom__" className="bg-[var(--bg)] text-[var(--blue)] font-medium">
                    + เพิ่มอัลบั้มใหม่ (กำหนดเอง)...
                  </option>
                </select>
                <ChevronDown
                  size={15}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customAlbumInput}
                  onChange={(e) => setCustomAlbumInput(e.target.value)}
                  placeholder="เช่น กิจกรรมรับน้องปี 1, ทริปเขาใหญ่, กีฬาสี CS"
                  className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--blue)] focus:outline-none transition-colors"
                  autoFocus
                />
                <div className="flex justify-between items-center text-[11px] text-[var(--muted)]">
                  <span>พิมพ์ชื่ออัลบั้มที่ต้องการสร้างใหม่</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomAlbum(false);
                      setSelectedAlbum(availableAlbums[0]?.id || 'first-year');
                    }}
                    className="text-[var(--blue)] hover:underline flex items-center gap-1 font-medium"
                  >
                    <ArrowLeft size={11} /> เลือกจากอัลบั้มเดิม
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              ชื่อภาพความทรงจำ <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น บรรยากาศวันรับน้อง, ทริปถ่ายรูปริมทะเล"
              className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold mb-1">คำบรรยายสั้น ๆ</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="เช่น ช่วงเวลาดี ๆ ที่มีเพื่อนอยู่ด้วยเสมอ"
              className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--panel)] text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#93bfff] text-[#090f1b] hover:bg-[#b0d0ff] text-sm font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            >
              <Sparkles size={15} /> {isSubmitting ? 'กำลังอัปโหลด...' : 'บันทึกภาพลงอัลบั้ม'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
