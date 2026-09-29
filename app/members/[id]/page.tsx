import { notFound } from 'next/navigation';
import { members } from '@/data/members';
import { MemberProfileView } from '@/components/member-profile-view';

export function generateStaticParams() {
  return members.map((m) => ({ id: m.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = members.find((m) => m.id === id);
  return {
    title: member ? `${member.nickname} — CS66` : 'ไม่พบสมาชิก — CS66',
    description: member?.quote,
  };
}

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const index = members.findIndex((m) => m.id === id);
  if (index < 0) notFound();

  const member = members[index];
  const prev = members[(index + members.length - 1) % members.length];
  const next = members[(index + 1) % members.length];

  return (
    <MemberProfileView
      initialMember={member}
      initialPrev={prev}
      initialNext={next}
      initialIndex={index}
      initialTotal={members.length}
      memberId={id}
    />
  );
}

