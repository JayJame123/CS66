'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  UserPlus,
  Pencil,
  Trash2,
  X,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import {
  defaultTeachers,
  teacherCategories,
  teacherCategoryLabels,
  type Teacher,
} from '@/data/teachers';
import {
  getTeachers,
  deleteTeacher,
  subscribeToTeachers,
} from '@/lib/teacher-storage';
import { TeacherModal } from '@/components/teacher-modal';
import { TeacherQuickViewModal } from '@/components/teacher-quick-view-modal';

export function TeachersSection() {
  const [teachers, setTeachers] = useState<Teacher[]>(defaultTeachers);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [quickViewTeacher, setQuickViewTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    setTeachers(getTeachers());
    const unsubscribe = subscribeToTeachers((updated) => setTeachers(updated));
    return () => unsubscribe();
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set<string>(teacherCategories);
    teachers.forEach((t) => {
      if (t.category && t.category.trim() && t.category !== 'All') {
        set.add(t.category.trim());
      }
    });
    return Array.from(set);
  }, [teachers]);

  const visibleTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchCategory = filter === 'All' || t.category === filter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q ||
        `${t.academicTitle || ''} ${t.fullname} ${t.nickname || ''} ${t.position} ${t.category} ${t.courses?.join(' ') || ''}`
          .toLowerCase()
          .includes(q);
      return matchCategory && matchQuery;
    });
  }, [teachers, filter, query]);

  const handleEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = (t: Teacher) => {
    if (confirm(`คุณต้องการลบข้อมูล "${t.fullname}" ใช่หรือไม่?`)) {
      deleteTeacher(t.id);
      setTeachers(getTeachers());
    }
  };

  return (
    <section id="teachers" className="section members-section">
      <div className="container">
        {/* Section Heading */}
        <div className="section-heading flex-wrap gap-4 items-end justify-between">
          <div>
            <div className="section-kicker">03 — คณาจารย์ผู้สอน</div>
            <h2 className="section-title">
              อาจารย์ที่ปรึกษา<span>และผู้สอน</span>
            </h2>
            <p className="muted">
              เบื้องหลังทุกความรู้และก้าวสำคัญของ CS66 · ขอบคุณคณาจารย์ทุกท่านที่คอยชี้แนะและมอบแรงบันดาลใจ
            </p>
          </div>
          <div className="section-note">
            <GraduationCap size={16} />
            คณาจารย์ในระบบ {teachers.length} ท่าน
          </div>
        </div>

        {/* Directory Controls */}
        <div className="directory-controls">
          <div className="filters" aria-label="กรองตามความเชี่ยวชาญอาจารย์">
            {allCategories.map((c) => (
              <button
                key={c}
                className={filter === c ? 'active' : ''}
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
              >
                {teacherCategoryLabels[c] || c}
              </button>
            ))}
          </div>

          <div className="action-toolbar">
            <label className="search">
              <Search size={17} />
              <input
                aria-label="ค้นหาอาจารย์"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อ หรือวิชาที่สอน..."
              />
              {query && (
                <button aria-label="ล้างคำค้น" onClick={() => setQuery('')}>
                  <X size={15} />
                </button>
              )}
            </label>

            <button
              type="button"
              className="add-member-button"
              onClick={() => {
                setModalMode('add');
                setEditingTeacher(null);
                setModalOpen(true);
              }}
            >
              <UserPlus size={15} /> เพิ่มอาจารย์ใหม่
            </button>
          </div>
        </div>

        {/* Meta Bar */}
        <div className="directory-meta">
          <span>
            แสดง {visibleTeachers.length} ท่าน (จากทั้งหมด {teachers.length} ท่าน)
          </span>
          <span className="text-xs text-[var(--muted)]">
            สาขาวิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยราชภัฏสกลนคร
          </span>
        </div>

        {/* Teacher Cards Grid */}
        <div className="member-grid">
          {visibleTeachers.map((t, index) => (
            <div className="member-card-wrapper" key={t.id}>
              {/* Card Action Buttons */}
              <div className="member-actions">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(t);
                  }}
                  className="card-action-btn"
                  title="แก้ไขข้อมูลอาจารย์"
                >
                  <Pencil size={11} />
                  <span>แก้ไข</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(t);
                  }}
                  className="card-action-btn delete"
                  title="ลบข้อมูลอาจารย์"
                >
                  <Trash2 size={11} />
                  <span>ลบ</span>
                </button>
              </div>

              {/* Card Body */}
              <div
                className="member-card cursor-pointer group"
                onClick={() => setQuickViewTeacher(t)}
              >
                {/* Photo / Avatar */}
                <div
                  className="member-image"
                  style={{
                    backgroundColor: `${t.color || '#6baaff'}10`,
                  }}
                >
                  {t.image ? (
                    <img
                      src={t.image}
                      alt={t.fullname}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="avatar flex flex-col items-center justify-center font-bold"
                      style={{ color: t.color || '#6baaff' }}
                    >
                      <span className="text-5xl">{t.fullname.slice(0, 1)}</span>
                      <span className="text-[10px] tracking-widest opacity-60 font-mono mt-1">
                        FACULTY
                      </span>
                    </div>
                  )}

                  <span className="member-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="profile-arrow">
                    <ArrowUpRight size={14} />
                  </span>
                </div>

                {/* Info Block */}
                <div className="member-info">
                  <span
                    className="role font-semibold"
                    style={{ color: t.color || '#6baaff' }}
                  >
                    {t.position}
                  </span>

                  <h3 className="truncate">
                    {t.fullname}
                    {t.nickname && (
                      <span className="text-sm font-normal text-[var(--muted)] ml-1">
                        ({t.nickname})
                      </span>
                    )}
                  </h3>

                  <p className="line-clamp-1">{teacherCategoryLabels[t.category] || t.category}</p>

                  {t.quote && (
                    <div className="member-quote line-clamp-2">
                      “{t.quote}”
                    </div>
                  )}

                  {t.courses && t.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {t.courses.slice(0, 2).map((course) => (
                        <span
                          key={course}
                          className="px-2 py-0.5 rounded text-[10px] bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)] flex items-center gap-1"
                        >
                          <BookOpen size={9} />
                          {course}
                        </span>
                      ))}
                      {t.courses.length > 2 && (
                        <span className="text-[10px] text-[var(--muted)] self-center">
                          +{t.courses.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="profile-link mt-4 pt-3 border-t border-[var(--line)]">
                    <span className="text-[11px] text-[var(--blue)]">
                      ดูประวัติและรายวิชาที่สอน
                    </span>
                    <ArrowUpRight size={13} className="text-[var(--blue)]" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!visibleTeachers.length && (
          <div className="empty-state">
            <GraduationCap size={36} className="text-[var(--muted)] opacity-60" />
            <h3>ยังไม่พบข้อมูลอาจารย์ที่ค้นหา</h3>
            <p>ลองใช้ชื่ออื่น หรือเปลี่ยนหมวดหมู่ความเชี่ยวชาญ</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setQuery('');
                setFilter('All');
              }}
            >
              ล้างการค้นหา
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <TeacherModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={modalMode}
        initialTeacher={editingTeacher}
        onSuccess={() => setTeachers(getTeachers())}
      />

      <TeacherQuickViewModal
        teacher={quickViewTeacher}
        open={Boolean(quickViewTeacher)}
        onOpenChange={(op) => {
          if (!op) setQuickViewTeacher(null);
        }}
        onEdit={(t) => handleEdit(t)}
        onDelete={(t) => handleDelete(t)}
      />
    </section>
  );
}
