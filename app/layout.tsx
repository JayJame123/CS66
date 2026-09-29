import type { Metadata } from 'next';
import './globals.css';
import ThemeSync from '@/components/theme-sync';
export const metadata: Metadata = { title: 'CS66 — มากกว่าเพื่อนร่วมคลาส', description: 'ทำเนียบรุ่นวิทยาการคอมพิวเตอร์ CS66 มหาวิทยาลัยราชภัฏสกลนคร · 4 ปีแห่งการเขียนโค้ด มิตรภาพ และความทรงจำ', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) { return <html lang="th" data-scroll-behavior="smooth" suppressHydrationWarning><body><ThemeSync/>{children}</body></html>; }
