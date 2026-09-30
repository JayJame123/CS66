'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { X, Upload, Trash2, GraduationCap, ChevronDown, Palette, Check, ArrowLeft, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { teacherCategories, teacherCategoryLabels, type Teacher } from '@/data/teachers';
import { addTeacher, updateTeacher, getTeachers } from '@/lib/teacher-storage';

interface TeacherModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialTeacher?: Teacher | null;
  onSuccess?: (teacher: Teacher) => void;
}

const COLOR_PRESETS = [
  { label: 'Sky Blue', value: '#6baaff' },
  { label: 'Purple Lavender', value: '#bd9aff' },
  { label: 'Emerald Mint', value: '#68cfbb' },
  { label: 'Sunset Amber', value: '#f6ad55' },
  { label: 'Rose Coral', value: '#fc8181' },
  { label: 'Cyan Ocean', value: '#82c6e8' },
  { label: 'Lime Olive', value: '#b3bd73' },
];

export function TeacherModal({
  open,
  onOpenChange,
  mode,
  initialTeacher,
  onSuccess,
}: TeacherModalProps) {
  const isEdit = mode === 'edit' && Boolean(initialTeacher);

  const [academicTitle, setAcademicTitle] = useState('');
  const [fullname, setFullname] = useState('');
  const [nickname, setNickname] = useState('');
  const [position, setPosition] = useState('อาจารย์ประจำสาขาวิชา');
  const [category, setCategory] = useState('Software');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [quote, setQuote] = useState('');
  const [about, setAbout] = useState('');
  const [courses, setCourses] = useState('');
  const [email, setEmail] = useState('');
  const [office, setOffice] = useState('');
  const [image, setImage] = useState('');
  const [color, setColor] = useState('#6baaff');
  const [errors, setErrors] = useState<{ fullname?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const standardCategories = useMemo(
    () => teacherCategories.filter((c) => c !== 'All') as unknown as string[],
    []
  );

  const availableCategories = useMemo(() => {
    const set = new Set(standardCategories);
    try {
      const all = getTeachers();
      all.forEach((t) => {
        if (t.category && t.category.trim() && t.category !== 'All') {
          set.add(t.category.trim());
        }
      });
    } catch {}
    return Array.from(set);
  }, [standardCategories, open]);

  useEffect(() => {
    if (open) {
      if (isEdit && initialTeacher) {
        let name = initialTeacher.fullname || '';
        if (initialTeacher.academicTitle && !name.startsWith(initialTeacher.academicTitle)) {
          name = `${initialTeacher.academicTitle} ${name}`.trim();
        }
        setAcademicTitle('');
        setFullname(name);
        setNickname(initialTeacher.nickname || '');
        setPosition(initialTeacher.position || 'อาจารย์ประจำสาขาวิชา');
        setCategory(initialTeacher.category || 'Software');
        setIsCustomCategory(!standardCategories.includes(initialTeacher.category));
        setCustomCategoryInput(
          !standardCategories.includes(initialTeacher.category) ? initialTeacher.category : ''
        );
        setQuote(initialTeacher.quote || '');
        setAbout(initialTeacher.about || '');
        setCourses(initialTeacher.courses?.join(', ') || '');
        setEmail(initialTeacher.email || '');
        setOffice(initialTeacher.office || '');
        setImage(initialTeacher.image || '');
        setColor(initialTeacher.color || '#6baaff');
      } else {
        setAcademicTitle('');
        setFullname('');
        setNickname('');
        setPosition('อาจารย์ประจำสาขาวิชา');
        setCategory('Software');
        setIsCustomCategory(false);
        setCustomCategoryInput('');
        setQuote('');
        setAbout('');
        setCourses('');
        setEmail('');
        setOffice('');
        setImage('');
        setColor('#6baaff');
      }
      setErrors({});
    }
  }, [open, isEdit, initialTeacher, standardCategories]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('ขนาดไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ภาพขนาดไม่เกิน 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      setErrors({ fullname: 'กรุณากรอกชื่อ-นามสกุล' });
      return;
    }

    setIsSubmitting(true);

    const finalCategory = isCustomCategory
      ? customCategoryInput.trim() || 'Software'
      : category;

    const courseList = courses
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    try {
      if (isEdit && initialTeacher) {
        const updated = updateTeacher(initialTeacher.id, {
          academicTitle: undefined,
          fullname: fullname.trim(),
          nickname: nickname.trim() || undefined,
          position: position.trim() || 'อาจารย์ประจำสาขาวิชา',
          category: finalCategory,
          quote: quote.trim() || undefined,
          about: about.trim() || undefined,
          courses: courseList.length > 0 ? courseList : undefined,
          email: email.trim() || undefined,
          office: office.trim() || undefined,
          image: image.trim() || undefined,
          color,
        });
        if (updated) onSuccess?.(updated);
      } else {
        const added = addTeacher({
          academicTitle: undefined,
          fullname: fullname.trim(),
          nickname: nickname.trim() || undefined,
          position: position.trim() || 'อาจารย์ประจำสาขาวิชา',
          category: finalCategory,
          quote: quote.trim() || undefined,
          about: about.trim() || undefined,
          courses: courseList.length > 0 ? courseList : undefined,
          email: email.trim() || undefined,
          office: office.trim() || undefined,
          image: image.trim() || undefined,
          color,
        });
        onSuccess?.(added);
      }

      onOpenChange(false);
    } catch {
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--blue)]/15 border border-[var(--blue)]/30 flex items-center justify-center text-[var(--blue)]">
              <GraduationCap size={17} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? 'แก้ไขข้อมูลอาจารย์' : 'เพิ่มข้อมูลอาจารย์ใหม่'}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--muted)]">
                ข้อมูลอาจารย์ผู้สอนและอาจารย์ที่ปรึกษา สาขาวิชาวิทยาการคอมพิวเตอร์
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar and Basic Info */}
          <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div
                className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[var(--line)] bg-[var(--panel)] relative flex items-center justify-center shadow-inner"
                style={{ borderColor: `${color}40` }}
              >
                {image ? (
                  <img src={image} alt={fullname || 'อาจารย์'} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center text-3xl font-bold"
                    style={{ color }}
                  >
                    <span>{fullname ? fullname.slice(0, 1) : 'อ.'}</span>
                    <span className="text-[9px] tracking-widest opacity-60 font-mono mt-1">CS / FACULTY</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs rounded-md bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] flex items-center gap-1.5 transition-colors"
                >
                  <Upload size={12} /> อัปโหลดรูป
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="p-1 text-red-400 hover:bg-red-500/20 rounded border border-red-500/30 transition-colors"
                    title="ลบรูป"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Name Fields */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  ชื่อ-นามสกุลอาจารย์ <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value);
                    if (errors.fullname) setErrors({});
                  }}
                  placeholder="เช่น ผศ.ดร.วรเชษฐ์ สุขเกษม หรือ อาจารย์ ดร.สมชาย"
                  className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
                {errors.fullname && (
                  <span className="text-[11px] text-red-400 mt-1 block">{errors.fullname}</span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">ชื่อเรียก / นามปากกา</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น อ.ดร.เชษฐ์"
                    className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">ตำแหน่ง</label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="เช่น ประธานหลักสูตร, อาจารย์ประจำสาขา"
                    className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Category & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--line)]">
            <div>
              <div className="flex items-center justify-between h-6 mb-1.5">
                <label className="text-xs font-semibold text-[var(--text)] whitespace-nowrap">
                  ความเชี่ยวชาญ / สายวิชา
                </label>
                {!isCustomCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(true);
                      setCustomCategoryInput('');
                    }}
                    className="text-xs text-[var(--blue)] hover:text-white hover:bg-[var(--blue)]/20 px-2 py-0.5 rounded-full border border-[var(--blue)]/30 transition-all flex items-center gap-1 font-medium whitespace-nowrap shrink-0"
                    style={{ fontSize: '11px', lineHeight: '14px' }}
                  >
                    <Plus size={11} /> เพิ่มใหม่
                  </button>
                )}
              </div>

              {!isCustomCategory ? (
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomCategory(true);
                        setCustomCategoryInput('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                    className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors pr-9 appearance-none cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[var(--bg)] text-[var(--text)]">
                        {teacherCategoryLabels[cat] || cat}
                      </option>
                    ))}
                    <option value="__custom__" className="bg-[var(--bg)] text-[var(--blue)] font-medium">
                      + เพิ่มหมวดหมู่ใหม่ (กำหนดเอง)...
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
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    placeholder="เช่น Game Development, IoT, หุ่นยนต์"
                    className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--blue)] focus:outline-none transition-colors"
                    autoFocus
                  />
                  <div className="flex justify-between items-center text-[11px] text-[var(--muted)]">
                    <span>พิมพ์หมวดหมู่ที่ต้องการ</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(false);
                        setCategory(availableCategories[0] || 'Software');
                      }}
                      className="text-[var(--blue)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <ArrowLeft size={11} /> เลือกจากรายการเดิม
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between h-6 mb-1.5">
                <label className="text-xs font-semibold flex items-center gap-1.5">
                  <Palette size={13} className="text-[var(--blue)]" />
                  สีประจำตัวอาจารย์
                </label>
                <span className="text-[11px] font-mono text-[var(--muted)] px-1.5 py-0.5 rounded bg-[var(--panel)] border border-[var(--line)]">
                  {color}
                </span>
              </div>

              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--panel)]/50 border border-[var(--line)] h-10">
                <label className="relative flex items-center justify-center cursor-pointer group shrink-0" title="เลือกสีอิสระ">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                  <div
                    className="w-7 h-7 rounded-lg border-2 border-white/20 shadow-inner flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/40" />
                  </div>
                </label>

                <div className="h-4 w-px bg-[var(--line)] shrink-0" />

                <div className="flex items-center gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = color.toLowerCase() === preset.value.toLowerCase();
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        title={preset.label}
                        onClick={() => setColor(preset.value)}
                        className={`w-5 h-5 rounded-full transition-all relative flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-[var(--blue)] ring-offset-2 ring-offset-[var(--bg)] scale-110'
                            : 'hover:scale-110 opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: preset.value }}
                      >
                        {isSelected && <Check size={10} className="text-black drop-shadow" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quote & Courses */}
          <div className="space-y-4 pt-2 border-t border-[var(--line)]">
            <div>
              <label className="block text-xs font-semibold mb-1">คำสอน / คำแนะนำถึงนักศึกษา CS66</label>
              <input
                type="text"
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="เช่น โค้ดที่ดีเกิดจากการฝึกฝนอย่างสม่ำเสมอและความซื่อสัตย์ในวิชาชีพ"
                className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">รายวิชาที่สอน (คั่นด้วยเครื่องหมายจุลภาค)</label>
              <input
                type="text"
                value={courses}
                onChange={(e) => setCourses(e.target.value)}
                placeholder="เช่น Software Engineering, Web Development, Object-Oriented Programming"
                className="w-full h-10 px-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">เกี่ยวกับอาจารย์ / ความเชี่ยวชาญ</label>
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="แนะนำประวัติความเชี่ยวชาญ ผลงานวิจัย หรือบทบาทสำคัญในหลักสูตร..."
                className="w-full p-3 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors resize-none"
              />
            </div>
          </div>

          {/* Office & Email */}
          <div className="space-y-3 pt-2 border-t border-[var(--line)]">
            <label className="block text-xs font-semibold text-[var(--muted)]">ข้อมูลติดต่อและการนัดหมาย</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-[var(--muted)] mb-1 block">อีเมลติดต่อ</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@snru.ac.th"
                  className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
              </div>

              <div>
                <span className="text-[11px] text-[var(--muted)] mb-1 block">ห้องพักอาจารย์ / โต๊ะทำงาน</span>
                <input
                  type="text"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  placeholder="อาคาร 10 ห้อง 104"
                  className="w-full h-9 px-3 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-[var(--bg)] border-t border-[var(--line)] -mx-6 -mb-6 p-4 px-6 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-[var(--blue)] hover:opacity-90 text-[#090f1b] transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลอาจารย์'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
