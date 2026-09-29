'use client';
import Link from 'next/link';
import MemoriesGallery from '@/components/memories-gallery';
import { memories } from '@/data/memories';
import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, ArrowUp, Search, Sun, Moon, Menu, X, Shuffle, Code2, Terminal, Heart, Users, UserPlus, Pencil, Trash2, Database } from 'lucide-react';
import { flushSync } from 'react-dom';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { members, classSize, categories, categoryLabels, type Member } from '@/data/members';
import { getMembers, deleteMember, subscribeToMembers } from '@/lib/member-storage';
import { MemberModal } from '@/components/member-modal';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { DataManagerModal } from '@/components/data-manager-modal';
import { MemberQuickViewModal } from '@/components/member-quick-view-modal';

export function Avatar({ member, large = false }: { member: Member; large?: boolean }) {
  const isContain = member.imageFit === 'contain';
  return (
    <div className={`avatar ${large ? 'large-avatar' : ''}`} style={{ '--person': member.color } as React.CSSProperties}>
      {member.image ? (
        <img
          src={member.image}
          alt={member.nickname}
          loading="lazy"
          className={isContain ? 'contain-fit' : ''}
        />
      ) : (
        <>
          <span className="avatar-code">{'{ '}</span>
          <span>{member.nickname ? member.nickname.slice(0, 1) : '?'}</span>
          <span className="avatar-code">{' }'}</span>
          <small>CS / 66</small>
        </>
      )}
    </div>
  );
}
function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) { const reduce = useReducedMotion(); return <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{once:true, amount:.08}} transition={{duration:.55}}>{children}</motion.div>; }
function Counter({ to }: { to: number }) {
 const ref=useRef<HTMLSpanElement>(null); const [n,setN]=useState(0);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let frame=0;
  const observer=new IntersectionObserver(([entry])=>{
   if(!entry.isIntersecting)return;observer.disconnect();
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){setN(to);return;}
   let start=0;
   const step=(time:number)=>{if(!start)start=time;const progress=Math.min((time-start)/1000,1);setN(Math.round(to*(1-Math.pow(1-progress,3))));if(progress<1)frame=requestAnimationFrame(step);};
   frame=requestAnimationFrame(step);
  });
  observer.observe(el);return()=>{observer.disconnect();cancelAnimationFrame(frame);};
 },[to]);
 return <span ref={ref}>{n}</span>;
}
export default function Yearbook() {
 const [theme,setTheme]=useState('dark'),[menu,setMenu]=useState(false),[scrolled,setScrolled]=useState(false),[query,setQuery]=useState(''),[filter,setFilter]=useState('All'),[showIds,setShowIds]=useState(false),[terminal,setTerminal]=useState(false),[loading,setLoading]=useState(true),[random,setRandom]=useState<Member|null>(null),[shuffling,setShuffling]=useState(false);
 const [memberList, setMemberList] = useState<Member[]>(members);
 const [memberModalOpen, setMemberModalOpen] = useState(false);
 const [memberModalMode, setMemberModalMode] = useState<'add' | 'edit'>('add');
 const [editingMember, setEditingMember] = useState<Member | null>(null);
 const [deletingMember, setDeletingMember] = useState<Member | null>(null);
 const [deleteModalOpen, setDeleteModalOpen] = useState(false);
 const [dataManagerOpen, setDataManagerOpen] = useState(false);
 const [quickViewMember, setQuickViewMember] = useState<Member | null>(null);

 const clicks=useRef(0),shuffleTimer=useRef<ReturnType<typeof setInterval>|null>(null);
 useEffect(()=>{
  try{
    const stored=localStorage.getItem('cs66-theme');
    if(stored==='light'){
      queueMicrotask(()=>setTheme('light'));
    }
  }catch{}
  const t=setTimeout(()=>setLoading(false),650);
  const onScroll=()=>setScrolled(window.scrollY>40);
  onScroll();
  window.addEventListener('scroll',onScroll,{passive:true});
  
  // Hydrate custom members from localStorage
  queueMicrotask(()=>{
    const current = getMembers();
    setMemberList(current);
  });
  const unsubscribe = subscribeToMembers((updated) => setMemberList(updated));

  return()=>{
   clearTimeout(t);
   window.removeEventListener('scroll',onScroll);
   if(shuffleTimer.current)clearInterval(shuffleTimer.current);
   unsubscribe();
  };
 },[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;
  if(!context?.registerTool)return;
  const lifecycle=new AbortController();
 const allCategories = useMemo(() => {
  const set = new Set(categories);
  memberList.forEach((m) => {
   if (m.category && m.category.trim()) {
    set.add(m.category.trim());
   }
  });
  return Array.from(set);
 }, [memberList]);
  try { Promise.resolve(context.registerTool({name:'filter_cs66_members',title:'ค้นหาและกรองเพื่อน CS66',description:'Update the visible class directory search and role filter. Returns matching demo member summaries.',inputSchema:{type:'object',properties:{query:{type:'string'},role:{type:'string'}},required:['query','role'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){if(!input||typeof input!=='object')throw new Error('Expected query and role');const v=input as {query:unknown;role:unknown};if(typeof v.query!=='string'||v.query.length>200||typeof v.role!=='string'||!allCategories.includes(v.role))throw new Error('Invalid query or role');const q=v.query;const role=v.role;flushSync(()=>{setQuery(q);setFilter(role);});return {members:memberList.filter(m=>(role==='All'||m.category===role)&&`${m.nickname} ${m.fullname} ${m.studentId} ${m.role}`.toLocaleLowerCase().includes(q.trim().toLocaleLowerCase())).map(m=>({id:m.id,nickname:m.nickname,role:m.role}))};}}, {signal:lifecycle.signal})).catch(()=>{}); }catch{}
  return()=>lifecycle.abort();
 },[memberList]);
 const visible=memberList.filter(m=>(filter==='All'||m.category===filter)&&`${m.nickname} ${m.fullname} ${m.studentId} ${m.role}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
 const nav=[['หน้าแรก','home'],['เกี่ยวกับรุ่น','about'],['เพื่อนในรุ่น','members'],['ความทรงจำ','memories'],['เส้นทางของเรา','journey'],['ฝากถึงเพื่อน','message']];
 function shuffle(){
  const pool = memberList.length > 0 ? memberList : members;
  if(shuffling || pool.length === 0)return;
  setShuffling(true);let count=0;
  shuffleTimer.current=setInterval(()=>{
   setRandom(pool[Math.floor(Math.random()*pool.length)]);
   if(++count>=14){if(shuffleTimer.current)clearInterval(shuffleTimer.current);setShuffling(false);}
  },85);
 }
 return <>
 {loading&&<div className="loading-screen" aria-live="polite"><strong>&lt;CS66 /&gt;</strong><span>กำลังเปิดสมุดความทรงจำ...</span></div>}
 <header className={`nav-wrap ${scrolled?'scrolled':''}`}><nav className="nav container" aria-label="เมนูหลัก"><button className="brand" aria-label="โลโก้ CS66" onClick={()=>{clicks.current++;if(clicks.current%5===0)setTerminal(true);}}><Code2 size={25}/><b>CS66<span>.</span></b></button><div className={`nav-links ${menu?'open':''}`}>{nav.map(([name,id])=><a key={id} href={`#${id}`} onClick={()=>setMenu(false)}>{name}</a>)}</div><div className="nav-end"><span className="batch">รุ่นปีการศึกษา 2566</span><button className="icon-button" aria-label={theme==='dark'?'เปลี่ยนเป็นโหมดสว่าง':'เปลี่ยนเป็นโหมดมืด'} onClick={()=>{const next=theme==='dark'?'light':'dark';setTheme(next);try{localStorage.setItem('cs66-theme',next);}catch{}}}>{theme==='dark'?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-button mobile-toggle" aria-label="เปิดหรือปิดเมนู" aria-expanded={menu} onClick={()=>setMenu(!menu)}>{menu?<X/>:<Menu/>}</button></div></nav></header>
 <main>
 <section id="home" className="hero"><div className="hero-grid"/><div className="container hero-inner"><div className="hero-topline"><span><i className="status-dot"/> เรื่องราวบทหนึ่งที่เราเขียนด้วยกัน</span><span>สกลนคร ประเทศไทย ↗</span></div><div className="hero-main"><div className="hero-copy"><div className="eyebrow">ทำเนียบรุ่นวิทยาการคอมพิวเตอร์ <span>2023 — 2027</span></div><h1>CS<span>66</span><i>.</i></h1><h2>มากกว่าเพื่อนร่วมคลาส<br/>เราคือ <span>CS66.</span></h2><p>4 ปีแห่งการเขียนโค้ด มิตรภาพ และความทรงจำ<br/><span className="thai">ทุกบรรทัดของโค้ด มีเรื่องราวของเราอยู่ในนั้น</span></p><div className="hero-actions"><a href="#members" className="button primary">รู้จักเพื่อนในรุ่น <ArrowUpRight size={19}/></a><a href="#memories" className="button secondary">ความทรงจำของเรา <ArrowRight size={18}/></a></div><div className="university"><span className="uni-icon"><Code2 size={21}/></span><div><strong>วิทยาการคอมพิวเตอร์ รุ่น 66</strong><span>มหาวิทยาลัยราชภัฏสกลนคร</span></div></div></div><div className="hero-visual real-hero"><div className="photo-frame"><img src={memories[0].image} alt="ภาพหมู่กิจกรรมสานสัมพันธ์เพื่อน CS66 ปี 1" fetchPriority="high"/><div className="photo-shade"/><span className="photo-label"><span className="status-dot"/> วันธรรมดาที่กลายเป็นความทรงจำดี ๆ</span><div className="photo-caption"><span>ต่างคน ต่างเรื่องราว<br/><b>แต่เป็นความทรงจำเดียวกัน</b></span><span className="round-arrow"><ArrowUpRight/></span></div><small className="sample-caption">สานสัมพันธ์ปี 1 · จุดเริ่มต้นของคำว่าเรา</small></div><div className="code-note"><div><span/><span/><span/><small>friendship.ts</small></div><code><em>while</em> (friendship) {'{'}<br/>&nbsp;&nbsp;memories<span>++</span>;<br/>{'}'} <span className="code-comment">{'// forever.'}</span></code></div><span className="vertical-note">เริ่มต้นปี 2566 / เรื่องราวของเรายังดำเนินต่อ</span></div></div><div className="hero-bottom"><a href="#about"><span>↓</span> เลื่อนลงมาอ่านเรื่องราวของเรา</a><span>01 / จุดเริ่มต้น</span><span className="mono">&lt; friendship never expires /&gt;</span></div></div></section>
 <section id="about" className="section container"><Reveal><div className="section-kicker">01 — เรื่องราวของเรา</div><div className="about-layout"><h2 className="section-title">จากคนละเส้นทาง<br/>มาพบกันที่ <span>CS66.</span></h2><div className="about-copy"><h3>เริ่มจาก “Hello World”<br/>กลายเป็นโลกใบเดียวกัน</h3><p>CS66 คือกลุ่มนักศึกษาสาขาวิชาวิทยาการคอมพิวเตอร์ มหาวิทยาลัยราชภัฏสกลนคร ที่เริ่มต้นเส้นทางการศึกษาในปีการศึกษา 2566</p><p>เรามาจากต่างสถานที่ ต่างความคิด และต่างความฝัน แต่ได้มาเรียนรู้ เขียนโปรแกรม ทำโปรเจกต์ แก้ Bug และสร้างความทรงจำร่วมกัน</p></div></div><div className="stats"><div><strong><Counter to={memberList.length || classSize}/><span> คน</span></strong><small>สมาชิก CS66 ที่บันทึกไว้</small></div><div><strong>—</strong><small>โปรเจกต์ · รอเพิ่มข้อมูลจริง</small></div><div><strong><Counter to={4}/><span> ปี</span></strong><small>บนเส้นทางเดียวกัน · 2566–2570</small></div><div><strong>∞</strong><small>ความทรงจำที่อยากเก็บไว้</small></div></div></Reveal></section>
 <section id="members" className="section members-section"><div className="container"><Reveal><div className="section-heading"><div><div className="section-kicker">02 — เพื่อนร่วมรุ่น</div><h2 className="section-title">รู้จักเพื่อน <span>CS66.</span></h2><p className="muted">เบื้องหลังทุกความทรงจำ คือเพื่อนเหล่านี้ · เพื่อนสามารถกดแก้ไขหรือเพิ่มโปรไฟล์ตัวเองได้</p></div><div className="section-note"><Users size={16}/>สมาชิกในระบบ {memberList.length} คน</div></div>
 <div className="directory-controls">
  <div className="filters" aria-label="กรองตามความสนใจ">{allCategories.map(c=><button key={c} className={filter===c?'active':''} aria-pressed={filter===c} onClick={()=>setFilter(c)}>{categoryLabels[c] || c}</button>)}</div>
  <div className="action-toolbar">
   <label className="search"><Search size={17}/><input aria-label="ค้นหาเพื่อนในรุ่น" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหาชื่อ หรือชื่อเล่น..." />{query&&<button aria-label="ล้างคำค้น" onClick={()=>setQuery('')}><X size={15}/></button>}</label>
   <button type="button" className="add-member-button" onClick={()=>{setMemberModalMode('add');setEditingMember(null);setMemberModalOpen(true);}}><UserPlus size={15}/> เพิ่มเพื่อนใหม่</button>
   <button type="button" className="mgmt-button" onClick={()=>setDataManagerOpen(true)} title="จัดการและสำรองข้อมูล"><Database size={15}/> ข้อมูล</button>
  </div>
 </div>
 <div className="directory-meta"><span aria-live="polite">แสดง {visible.length} คน (จากทั้งหมด {memberList.length} คน)</span><label><input type="checkbox" checked={showIds} onChange={e=>setShowIds(e.target.checked)}/> แสดงรหัสนักศึกษา</label></div>
 <div className="member-grid">
  {visible.map((m)=><div className="member-card-wrapper" key={m.id}>
   <div className="member-actions">
    <button type="button" className="card-action-btn" title={`แก้ไขโปรไฟล์ ${m.nickname}`} onClick={(e)=>{e.preventDefault();e.stopPropagation();setEditingMember(m);setMemberModalMode('edit');setMemberModalOpen(true);}}><Pencil size={11}/> แก้ไข</button>
    <button type="button" className="card-action-btn delete" title={`ลบโปรไฟล์ ${m.nickname}`} onClick={(e)=>{e.preventDefault();e.stopPropagation();setDeletingMember(m);setDeleteModalOpen(true);}}><Trash2 size={11}/> ลบ</button>
   </div>
   {members.some(orig=>orig.id===m.id)?(
    <Link href={`/members/${m.id}`} className="member-card">
     <div className="member-image"><Avatar member={m}/><span className="member-index">{String(memberList.indexOf(m)+1).padStart(2,'0')}</span><span className="profile-arrow"><ArrowUpRight size={18}/></span></div>
     <div className="member-info"><span className="role" style={{color:m.color}}>{m.role}</span><h3>{m.nickname}<span>↗</span></h3><p>{m.fullname}</p>{showIds&&<small className="mono">{m.studentId}</small>}<div className="member-quote">“{m.quote}”</div><span className="profile-link">ดูโปรไฟล์ <ArrowRight size={13}/></span></div>
    </Link>
   ):(
    <div className="member-card" style={{cursor:'pointer'}} onClick={()=>setQuickViewMember(m)}>
     <div className="member-image"><Avatar member={m}/><span className="member-index">{String(memberList.indexOf(m)+1).padStart(2,'0')}</span><span className="profile-arrow"><ArrowUpRight size={18}/></span></div>
     <div className="member-info"><span className="role" style={{color:m.color}}>{m.role}</span><h3>{m.nickname}<span>↗</span></h3><p>{m.fullname}</p>{showIds&&<small className="mono">{m.studentId}</small>}<div className="member-quote">“{m.quote}”</div><span className="profile-link">ดูโปรไฟล์ <ArrowRight size={13}/></span></div>
    </div>
   )}
  </div>)}
 </div>
 {!visible.length&&<div className="empty-state"><Search size={32}/><h3>ยังไม่พบเพื่อนที่ค้นหา</h3><p>ลองใช้ชื่ออื่น หรือเปลี่ยนหมวดหมู่</p><button className="button secondary" onClick={()=>{setQuery('');setFilter('All');}}>ล้างการค้นหา</button></div>}
 <p className="data-note">มีสมาชิกในระบบ {memberList.length} คน · สามารถกดปุ่ม <strong>แก้ไข</strong> หรือ <strong>ลบ</strong> ที่การ์ดของแต่ละคน หรือกด <strong>+ เพิ่มเพื่อนใหม่</strong> ได้ทันที</p>
 </Reveal></div></section>
 <MemoriesGallery/>
 <section id="journey" className="section journey-section"><div className="container"><Reveal><div className="section-kicker">04 — เส้นทางของเรา</div><div className="section-heading"><h2 className="section-title">จากโค้ดบรรทัดแรก<br/>สู่<span>อนาคตของเรา</span></h2><p className="muted">เส้นทาง 4 ปีที่มีเราด้วยกัน<br/><small>เส้นทางตามแผนการศึกษา · 2023–2027</small></p></div><div className="timeline">{[{year:'2023',name:'สวัสดี โลกใบใหม่',label:'ปี 1 · จุดเริ่มต้น',text:'วันแรกของชีวิตนักศึกษา เพื่อนใหม่ และโค้ดบรรทัดแรก'},{year:'2024',name:'ลองผิด ลองใหม่ เรียนรู้',label:'ปี 2 · เรียนรู้ไปด้วยกัน',text:'ฐานข้อมูล การพัฒนาเว็บ และโปรเจกต์ที่สอนให้เราเติบโต'},{year:'2025',name:'ก้าวออกนอกห้องเรียน',label:'ปี 3 · ค้นหาตัวเอง',text:'โปรเจกต์ การฝึกประสบการณ์ และการค้นหาสิ่งที่ชอบ'},{year:'2026',name:'ทุ่มเทกับผลงานชิ้นสุดท้าย',label:'ปี 4 · เตรียมพร้อมก้าวต่อ',text:'โครงงานจบและการนำเสนอผลงานที่ตั้งใจ'},{year:'2027',name:'แล้วพบกันบนเส้นทางใหม่',label:'สำเร็จการศึกษา · ก้าวต่อไป',text:'ก้าวต่อไปในเส้นทางของเรา พร้อมความทรงจำที่อยู่เสมอ'}].map((x,i)=><div className={`timeline-item ${i===3?'current':''}`} key={x.year}><div className="timeline-year">{x.year}<span/></div><small>{x.label}</small><h3>{x.name}</h3><p>{x.text}</p></div>)}</div></Reveal></div></section>
 <section className="section container random-section"><Reveal className="random-panel"><div><span className="section-kicker"><Shuffle size={16}/> ลองให้ความบังเอิญพาไป</span><h2>วันนี้จะได้เจอ<br/><span>เพื่อนคนไหนนะ?</span></h2><p className="muted">วันนี้จักรวาลจะสุ่มให้คุณเจอใครใน CS66?</p><button className="button primary" onClick={shuffle} disabled={shuffling}><Shuffle size={17}/>{shuffling?'กำลังสุ่ม...':'สุ่มเพื่อนในรุ่น'}</button></div><div className={`random-result ${shuffling?'shuffling':''}`} aria-live="polite">{random?<><Avatar member={random}/><h3>{random.nickname}</h3><p>“{random.quote}”</p>{!shuffling&&(members.some(orig=>orig.id===random.id)?<Link href={`/members/${random.id}`} className="text-link">รู้จัก {random.nickname} <ArrowUpRight size={16}/></Link>:<button type="button" onClick={()=>setQuickViewMember(random)} className="text-link bg-transparent border-0 cursor-pointer">รู้จัก {random.nickname} <ArrowUpRight size={16}/></button>)}</>:<><div className="random-mark">?</div><span>เพื่อนดี ๆ อาจเริ่มจากความบังเอิญ</span><p>กดสุ่ม แล้วมาทำความรู้จักกัน</p></>}</div></Reveal></section>
 <section id="message" className="section container"><Reveal><div className="section-heading"><div><div className="section-kicker">05 — ข้อความที่อยากเก็บไว้</div><h2 className="section-title">ฝากข้อความ<span>ถึงเพื่อน</span></h2><p className="muted">บางข้อความ เก็บไว้ในใจได้ตลอดไป</p></div><Heart size={26} className="wall-heart"/></div><div className="wall">{[{name:'Jame',text:'ขอบคุณที่ช่วยกันแก้ Bug ทั้งในโค้ดและในชีวิต ไว้มาเขียนโปรเจกต์ด้วยกันอีกนะ',tag:'// friends for life'},{name:'Mint',text:'จากคนแปลกหน้า กลายเป็นคนที่อยู่ในทุกความทรงจำดี ๆ ขอบคุณสำหรับ 4 ปีนี้นะ',tag:'// best chapter ever'},{name:'Bank',text:'โค้ดอาจจะ Error แต่ความเป็นเพื่อนของเราไม่มีวันพัง อย่าลืม CS66 นะทุกคน',tag:'// friendship.status = 200'}].map((note,i)=><article key={note.name} className={`wall-note note-${i}`}><span className="quote-symbol">“</span><p>{note.text}</p><div><span className="note-initial">{note.name[0]}</span><strong>{note.name}<small>CS66 · ข้อความตัวอย่าง</small></strong><Heart size={14}/></div><code>{note.tag}</code></article>)}</div></Reveal></section>
 </main><footer><div className="container"><div className="footer-top"><div className="footer-brand">CS66<span>.</span></div><div><h3>ครั้งหนึ่งคือ CS66<br/>ตลอดไปก็คือ CS66</h3><p>สาขาวิชาวิทยาการคอมพิวเตอร์<br/>มหาวิทยาลัยราชภัฏสกลนคร</p></div><a href="#home" className="footer-up" aria-label="กลับด้านบน"><ArrowUpRight size={26}/></a></div><div className="footer-bottom"><span>© CS66 · 2023 — 2027</span><span>ทำด้วย <Heart size={12}/> จากเพื่อน CS66</span><span className="mono">git commit -m &quot;our best years&quot;</span></div></div></footer>
 {scrolled&&<a href="#home" className="back-top icon-button" aria-label="กลับด้านบน"><ArrowUp size={18}/></a>}
 <Dialog open={terminal} onOpenChange={setTerminal}><DialogContent className="terminal-dialog" showCloseButton={false}><DialogClose className="thai-dialog-close" aria-label="ปิดหน้าต่าง"><X size={18}/></DialogClose><DialogTitle><Terminal size={18}/> friendship.exe</DialogTitle><DialogDescription>คุณค้นพบเทอร์มินัลลับของ CS66 แล้ว!</DialogDescription><pre>{'> whoami\nCS66\n\n> sudo friendship --forever\nPermission granted ❤️\n\n> git log --oneline\n2023 : First Year\n2024 : Second Year\n2025 : Third Year\n2026 : Final Year\n\n> git commit -m "Best memories with CS66"\n[forever] Memories saved.\n\n> _'}</pre></DialogContent></Dialog>

 {/* Modals */}
 <MemberModal
  open={memberModalOpen}
  onOpenChange={setMemberModalOpen}
  mode={memberModalMode}
  initialMember={editingMember}
  onSuccess={() => setMemberList(getMembers())}
 />
 <DeleteConfirmModal
  open={deleteModalOpen}
  onOpenChange={setDeleteModalOpen}
  member={deletingMember}
  onConfirm={(id) => {
   deleteMember(id);
   setMemberList(getMembers());
  }}
 />
 <DataManagerModal
  open={dataManagerOpen}
  onOpenChange={setDataManagerOpen}
  members={memberList}
  onDataChanged={() => setMemberList(getMembers())}
 />
 <MemberQuickViewModal
  member={quickViewMember}
  open={Boolean(quickViewMember)}
  onOpenChange={(op) => {
   if (!op) setQuickViewMember(null);
  }}
  onEdit={(m) => {
   setEditingMember(m);
   setMemberModalMode('edit');
   setMemberModalOpen(true);
  }}
  onDelete={(m) => {
   setDeletingMember(m);
   setDeleteModalOpen(true);
  }}
 />
 </>;
}

