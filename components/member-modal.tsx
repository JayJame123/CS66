'use client';

import { useState, useRef, useMemo } from 'react';
import { X, Upload, Trash2, Sparkles, Link as LinkIcon, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Member, categories } from '@/data/members';
import { addMember, updateMember, getMembers } from '@/lib/member-storage';

interface MemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialMember?: Member | null;
  onSuccess?: (member: Member) => void;
}

const COLOR_PRESETS = [
  { label: 'Sky Blue', value: '#6baaff' },
  { label: 'Purple Lavender', value: '#bd9aff' },
  { label: 'Emerald Mint', value: '#68cfbb' },
  { label: 'Rose Pink', value: '#e3a3c8' },
  { label: 'Lime Olive', value: '#b3bd73' },
  { label: 'Cyan Ocean', value: '#82c6e8' },
  { label: 'Sunset Amber', value: '#f6ad55' },
  { label: 'Coral Flame', value: '#fc8181' },
];

function MemberForm({
  mode,
  initialMember,
  onClose,
  onSuccess,
}: {
  mode: 'add' | 'edit';
  initialMember?: Member | null;
  onClose: () => void;
  onSuccess?: (member: Member) => void;
}) {
  const isEdit = mode === 'edit' && Boolean(initialMember);

  const [nickname, setNickname] = useState(isEdit && initialMember ? initialMember.nickname || '' : '');
  const [fullname, setFullname] = useState(isEdit && initialMember ? initialMember.fullname || '' : '');
  const [studentId, setStudentId] = useState(isEdit && initialMember ? initialMember.studentId || '' : '');
  const [role, setRole] = useState(isEdit && initialMember ? initialMember.role || '' : 'นักพัฒนาหน้าบ้าน');
  const standardCategories = useMemo(() => categories.filter((c) => c !== 'All'), []);
  const availableCategories = useMemo(() => {
    const set = new Set(standardCategories);
    try {
      const allMembers = getMembers();
      allMembers.forEach((m) => {
        if (m.category && m.category.trim() && m.category !== 'All') {
          set.add(m.category.trim());
        }
      });
    } catch {}
    return Array.from(set);
  }, [standardCategories]);

  const initialCat = isEdit && initialMember?.category ? initialMember.category : 'Frontend';
  const isInitialCustom = Boolean(isEdit && initialMember?.category && !standardCategories.includes(initialMember.category));

  const [category, setCategory] = useState(initialCat);
  const [isCustomCategory, setIsCustomCategory] = useState(isInitialCustom);
  const [customCategoryInput, setCustomCategoryInput] = useState(isInitialCustom ? initialCat : '');
  const [quote, setQuote] = useState(isEdit && initialMember ? initialMember.quote || '' : '');
  const [about, setAbout] = useState(isEdit && initialMember ? initialMember.about || '' : '');
  const [skills, setSkills] = useState(isEdit && initialMember ? initialMember.skills?.join(', ') || '' : 'HTML, CSS, JavaScript');
  const [color, setColor] = useState(isEdit && initialMember ? initialMember.color || '#6baaff' : '#6baaff');
  const [image, setImage] = useState(isEdit && initialMember ? initialMember.image || '' : '');
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>(isEdit && initialMember?.imageFit ? initialMember.imageFit : 'cover');
  const [birthday, setBirthday] = useState(isEdit && initialMember ? initialMember.birthday || '' : '');
  const [github, setGithub] = useState(isEdit && initialMember ? initialMember.social?.github || '' : '');
  const [facebook, setFacebook] = useState(isEdit && initialMember ? initialMember.social?.facebook || '' : '');
  const [instagram, setInstagram] = useState(isEdit && initialMember ? initialMember.social?.instagram || '' : '');
  const [tiktok, setTiktok] = useState(isEdit && initialMember ? initialMember.social?.tiktok || '' : '');
  const [errors, setErrors] = useState<{ nickname?: string; fullname?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    if (isSubmitting) return;
    e.preventDefault();
    const newErrors: { nickname?: string; fullname?: string } = {};

    if (!nickname.trim()) {
      newErrors.nickname = 'กรุณากรอกชื่อเล่น';
    }
    if (!fullname.trim()) {
      newErrors.fullname = 'กรุณากรอกชื่อ-นามสกุล';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const parsedSkills = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const finalCategory = isCustomCategory
      ? (customCategoryInput.trim() || 'ทั่วไป')
      : (category || 'Frontend');

    const memberData: Member = {
      id: isEdit && initialMember ? initialMember.id : '',
      nickname: nickname.trim(),
      fullname: fullname.trim(),
      studentId: studentId.trim() || 'CS66',
      role: role.trim() || 'สมาชิก CS66',
      category: finalCategory,
      quote: quote.trim() || 'เพื่อมิตรภาพ CS66 ตลอดไป',
      skills: parsedSkills.length ? parsedSkills : ['Coding'],
      color: color || '#6baaff',
      about: about.trim() || 'สมาชิกวิทยาการคอมพิวเตอร์ รุ่น 66 มหาวิทยาลัยราชภัฏสกลนคร',
      image: image.trim() || undefined,
      imageFit,
      birthday: birthday.trim() || undefined,
      social: {
        github: github.trim() || undefined,
        facebook: facebook.trim() || undefined,
        instagram: instagram.trim() || undefined,
        tiktok: tiktok.trim() || undefined,
      },
    };

    if (isEdit) {
      updateMember(memberData);
    } else {
      addMember(memberData);
    }

    onSuccess?.(memberData);
    onClose();
  };

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line)] bg-[var(--bg)] px-6 py-4 backdrop-blur-md">
        <div>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--blue)]" />
            {mode === 'add' ? 'เพิ่มเพื่อนใหม่ในรุ่น CS66' : `แก้ไขโปรไฟล์: ${nickname || 'เพื่อน'}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--muted)] mt-1">
            {mode === 'add'
              ? 'กรอกข้อมูลและรูปภาพเพื่อเพิ่มลงในทำเนียบรุ่น CS66'
              : 'ปรับปรุงข้อมูล คำคม รูปภาพ หรือช่องทางติดต่อของคุณ'}
          </DialogDescription>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] transition-colors"
          aria-label="ปิด"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Top Section: Avatar & Basic Identity */}
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-3 w-full sm:w-auto">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-[var(--line)] overflow-hidden flex items-center justify-center relative shadow-inner bg-[var(--panel)]"
              style={{ borderColor: color }}
            >
              {image ? (
                <img
                  src={image}
                  alt={nickname || 'Preview'}
                  className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-1' : 'object-cover object-top'}`}
                />
              ) : (
                <div
                  className="w-full h-full flex flex-col items-center justify-center text-3xl font-bold"
                  style={{ color: color }}
                >
                  <span>{nickname ? nickname.slice(0, 1) : '?'}</span>
                  <span className="text-[9px] tracking-widest opacity-60 font-mono mt-1">CS / 66</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
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
                  className="px-3 py-1.5 text-xs rounded-md bg-[var(--panel)] hover:bg-[var(--line)] border border-[var(--line)] flex items-center gap-1.5 transition-colors"
                >
                  <Upload size={13} /> อัปโหลดรูป
                </button>
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                    title="ลบรูป"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {image && (
                <div className="flex gap-1 p-0.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] text-[10px]">
                  <button
                    type="button"
                    onClick={() => setImageFit('cover')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      imageFit === 'cover'
                        ? 'bg-[var(--blue)] text-[#090f1b] font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    เต็มกรอบ
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageFit('contain')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      imageFit === 'contain'
                        ? 'bg-[var(--blue)] text-[#090f1b] font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    แสดงทั้งรูป
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Core Info */}
          <div className="flex-1 w-full space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  ชื่อเล่น <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (errors.nickname) setErrors((prev) => ({ ...prev, nickname: undefined }));
                  }}
                  placeholder="เช่น เจมส์, มิ้นท์, กอล์ฟ"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
                {errors.nickname && (
                  <span className="text-[11px] text-red-400 mt-1 block">{errors.nickname}</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  ชื่อ-นามสกุลจริง <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullname}
                  onChange={(e) => {
                    setFullname(e.target.value);
                    if (errors.fullname) setErrors((prev) => ({ ...prev, fullname: undefined }));
                  }}
                  placeholder="เช่น ณัฐวุฒิ สมบูรณ์"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
                {errors.fullname && (
                  <span className="text-[11px] text-red-400 mt-1 block">{errors.fullname}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">รหัสนักศึกษา</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="เช่น 66314050101-1"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] font-mono transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">วันเกิด</label>
                <input
                  type="text"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  placeholder="เช่น 15 มกราคม 2548"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 flex items-center gap-1">
                <LinkIcon size={12} /> หรือใส่ URL รูปภาพโดยตรง
              </label>
              <input
                type="text"
                value={image.startsWith('data:') ? '' : image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... หรือ /members/name.jpg"
                className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Role, Category & Color */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[var(--line)]">
          <div>
            <label className="block text-xs font-semibold mb-1">บทบาท / ฉายา</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="เช่น นักพัฒนาหน้าบ้าน, เกมเมอร์"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold">หมวดหมู่สายงาน</label>
              {!isCustomCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomCategory(true);
                    setCustomCategoryInput('');
                  }}
                  className="text-[11px] text-[var(--blue)] hover:underline flex items-center gap-0.5"
                >
                  <Plus size={12} /> เพิ่มใหม่
                </button>
              )}
            </div>

            {!isCustomCategory ? (
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
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[var(--bg)] text-[var(--text)]">
                    {cat}
                  </option>
                ))}
                <option value="__custom__" className="bg-[var(--bg)] text-[var(--blue)] font-medium">
                  + เพิ่มหมวดหมู่ใหม่ (กำหนดเอง)...
                </option>
              </select>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customCategoryInput}
                  onChange={(e) => setCustomCategoryInput(e.target.value)}
                  placeholder="เช่น Mobile App, DevOps, ตากล้อง"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--blue)] focus:outline-none transition-colors"
                  autoFocus
                />
                <div className="flex justify-between items-center text-[11px] text-[var(--muted)]">
                  <span>พิมพ์หมวดหมู่ที่ต้องการ</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCategory(availableCategories[0] || 'Frontend');
                    }}
                    className="text-[var(--blue)] hover:underline"
                  >
                    ← เลือกจากรายการเดิม
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">สีประจำตัว</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded cursor-pointer border border-[var(--line)] bg-[var(--panel)]"
              />
              <div className="flex gap-1 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setColor(preset.value)}
                    className="w-5 h-5 rounded-full border border-black/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: preset.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quote & About */}
        <div className="space-y-4 pt-2 border-t border-[var(--line)]">
          <div>
            <label className="block text-xs font-semibold mb-1">คำคมประจำใจ</label>
            <input
              type="text"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="เช่น กิน • นอน • เขียนโค้ด • วนไป"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">เกี่ยวกับฉัน / ข้อความแนะนำตัว</label>
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="แนะนำตัวเอง ความสนใจ สิ่งที่ชอบทำตอนเรียน หรือเรื่องประทับใจ..."
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">ทักษะและความถนัด (คั่นด้วยจุลภาค)</label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="เช่น React, TypeScript, Python, Figma, SQL"
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-3 pt-2 border-t border-[var(--line)]">
          <label className="block text-xs font-semibold text-[var(--muted)]">ช่องทางติดต่อ (ไม่บังคับ)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-[var(--muted)] mb-1 block">Facebook URL</span>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>

            <div>
              <span className="text-[11px] text-[var(--muted)] mb-1 block">Instagram URL</span>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>

            <div>
              <span className="text-[11px] text-[var(--muted)] mb-1 block">TikTok URL</span>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>

            <div>
              <span className="text-[11px] text-[var(--muted)] mb-1 block">GitHub URL</span>
              <input
                type="url"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-[var(--panel)] border border-[var(--line)] focus:outline-none focus:border-[var(--blue)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="sticky bottom-0 bg-[var(--bg)] border-t border-[var(--line)] -mx-6 -mb-6 p-4 px-6 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--line)] hover:bg-[var(--panel)] text-sm transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-[#93bfff] text-[#090f1b] hover:bg-[#b0d0ff] text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังบันทึกลงฐานข้อมูล...' : (mode === 'add' ? 'บันทึกเพิ่มเพื่อน' : 'บันทึกการแก้ไข')}
          </button>
        </div>
      </form>
    </>
  );
}

export function MemberModal({
  open,
  onOpenChange,
  mode,
  initialMember,
  onSuccess,
}: MemberModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-[var(--line)] bg-[var(--bg)] text-[var(--text)] shadow-2xl rounded-xl">
        {open && (
          <MemberForm
            key={initialMember?.id ? `edit-${initialMember.id}` : 'add-new'}
            mode={mode}
            initialMember={initialMember}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
