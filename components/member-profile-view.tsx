'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Code2, Pencil, Trash2 } from 'lucide-react';
import { type Member } from '@/data/members';
import { Avatar } from '@/components/yearbook';
import { getMembers, deleteMember, subscribeToMembers } from '@/lib/member-storage';
import { MemberModal } from '@/components/member-modal';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';

interface MemberProfileViewProps {
  initialMember: Member;
  initialPrev: Member;
  initialNext: Member;
  initialIndex: number;
  initialTotal: number;
  memberId: string;
}

export function MemberProfileView({
  initialMember,
  initialPrev,
  initialNext,
  initialIndex,
  initialTotal,
  memberId,
}: MemberProfileViewProps) {
  const router = useRouter();
  const [member, setMember] = useState<Member>(initialMember);
  const [prevMember, setPrevMember] = useState<Member>(initialPrev);
  const [nextMember, setNextMember] = useState<Member>(initialNext);
  const [index, setIndex] = useState(initialIndex);
  const [total, setTotal] = useState(initialTotal);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Sync with localStorage on client mount & when storage updates
  useEffect(() => {
    const syncCurrent = (list: Member[]) => {
      const idx = list.findIndex((m) => m.id === memberId);
      if (idx !== -1) {
        setMember(list[idx]);
        setIndex(idx);
        setTotal(list.length);
        const p = list[(idx + list.length - 1) % list.length];
        const n = list[(idx + 1) % list.length];
        setPrevMember(p);
        setNextMember(n);
      }
    };

    const currentList = getMembers();
    syncCurrent(currentList);

    return subscribeToMembers(syncCurrent);
  }, [memberId]);

  const handleDelete = (id: string) => {
    deleteMember(id);
    router.push('/#members');
  };

  return (
    <main className="profile-page container">
      {/* Header */}
      <header className="profile-header">
        <Link href="/#members" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft size={16} /> กลับไปหาเพื่อน CS66
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--panel)] hover:border-[var(--blue)] hover:text-[var(--blue)] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Pencil size={13} /> แก้ไขโปรไฟล์
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="p-1.5 rounded-lg border border-red-500/20 bg-[var(--panel)] hover:bg-red-500/10 text-red-400 transition-colors"
            title="ลบโปรไฟล์"
            aria-label="ลบโปรไฟล์"
          >
            <Trash2 size={15} />
          </button>
          <Link href="/" className="brand ml-2">
            <Code2 />
            <b>CS66.</b>
          </Link>
        </div>
      </header>

      {/* Main Detail Grid */}
      <div className="profile-detail">
        <div>
          <Avatar member={member} large />
          <p className="data-note flex items-center justify-between">
            <span>โปรไฟล์ของ {member.nickname} · CS66</span>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="text-[var(--blue)] hover:underline inline-flex items-center gap-1"
            >
              <Pencil size={11} /> แก้ไขข้อมูล
            </button>
          </p>
        </div>

        <div className="profile-details">
          <div className="section-kicker">
            เพื่อนในรุ่น / CS66 / {String(index + 1).padStart(2, '0')} (จาก {total} คน)
          </div>
          <span className="role" style={{ color: member.color }}>
            {member.role}
          </span>
          <h1 className="section-title">
            {member.nickname}
            <span>.</span>
          </h1>
          <h2>{member.fullname}</h2>

          <div className="profile-facts">
            <div>
              <span>รหัสนักศึกษา</span>
              {member.studentId}
            </div>
            <div>
              <span>สาย / หมวดหมู่</span>
              {member.category}
            </div>
            <div>
              <span>รุ่น</span>วิทยาการคอมพิวเตอร์ 66
            </div>
            {member.birthday && (
              <div>
                <span>วันเกิด</span>
                {member.birthday}
              </div>
            )}
          </div>

          <h2>เกี่ยวกับฉัน</h2>
          <p>{member.about}</p>

          <blockquote>“{member.quote}”</blockquote>

          <h2>ทักษะและความถนัด</h2>
          <div className="skill-badges">
            {member.skills && member.skills.length > 0 ? (
              member.skills.map((skill) => <span key={skill}>{skill}</span>)
            ) : (
              <span className="text-[var(--muted)]">ยังไม่ได้ระบุทักษะ</span>
            )}
          </div>

          <h2>ช่องทางติดต่อ</h2>
          <div className="social-links">
            {member.social && Object.entries(member.social).filter(([, url]) => url).length ? (
              Object.entries(member.social)
                .filter(([, url]) => Boolean(url))
                .map(([name, url]) => (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--blue)] transition-colors capitalize"
                  >
                    {name} ↗
                  </a>
                ))
            ) : (
              <span className="muted">ยังไม่ได้เพิ่มช่องทางติดต่อ</span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Navigation Footer */}
      <nav className="profile-nav" aria-label="เพื่อนคนอื่นในรุ่น">
        <Link href={`/members/${prevMember.id}`}>← {prevMember.nickname}</Link>
        <Link href="/#members">เพื่อนทั้งหมด ({total} คน)</Link>
        <Link href={`/members/${nextMember.id}`}>{nextMember.nickname} →</Link>
      </nav>

      {/* Edit Modal */}
      <MemberModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        mode="edit"
        initialMember={member}
        onSuccess={(updated) => setMember(updated)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        member={member}
        onConfirm={handleDelete}
      />
    </main>
  );
}
