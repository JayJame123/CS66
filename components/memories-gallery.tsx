'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { albums, memories } from '@/data/memories';

export default function MemoriesGallery() {
 const [album,setAlbum]=useState('all');
 const [limit,setLimit]=useState(9);
 const [activeId,setActiveId]=useState<string|null>(null);
 const filtered=useMemo(()=>memories.filter(photo=>album==='all'||photo.album===album),[album]);
 const activeIndex=filtered.findIndex(photo=>photo.id===activeId);
 const active=filtered[activeIndex];
 const step=(direction:number)=>setActiveId(filtered[(activeIndex+direction+filtered.length)%filtered.length].id);
 useEffect(()=>{
  if(activeIndex<0)return;
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
    event.preventDefault();
    const direction=event.key==='ArrowRight'?1:-1;
    setActiveId(filtered[(activeIndex+direction+filtered.length)%filtered.length].id);
   }
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[activeIndex,filtered]);
 return <section id="memories" className="section container real-memories">
  <div className="section-heading"><div><div className="section-kicker">03 — ช่วงเวลาดี ๆ ของพวกเรา</div><h2 className="section-title">วันธรรมดา<span>ที่คิดถึง</span></h2><p className="muted">จากวันแรกที่รู้จักกัน ถึงทุกทริปและทุกเสียงหัวเราะ</p></div><span className="section-note"><Camera size={17}/>{memories.length} ภาพ · 4 อัลบั้มความทรงจำ</span></div>
  <div className="album-toolbar"><div className="filters album-filters" aria-label="เลือกอัลบั้มภาพ">{albums.map(item=><button key={item.id} aria-pressed={album===item.id} className={album===item.id?'active':''} onClick={()=>{setAlbum(item.id);setLimit(9);}}>{item.label}<span>{item.id==='all'?memories.length:memories.filter(photo=>photo.album===item.id).length}</span></button>)}</div><p className="muted album-count" aria-live="polite">{filtered.length} ภาพที่อยากเก็บไว้</p></div>
  <div className="album-grid">{filtered.slice(0,limit).map((photo,i)=><button key={photo.id} className="album-photo" onClick={()=>setActiveId(photo.id)} aria-label={`เปิดภาพ ${photo.title}`}>
   <div className="album-image"><img src={photo.image} alt={photo.title} loading="lazy"/><span className="album-number">{String(i+1).padStart(2,'0')}</span><span className="album-open"><ArrowUpRight size={18}/></span></div>
   <div className="album-caption"><small>{photo.albumLabel}</small><h3>{photo.title}</h3></div>
  </button>)}</div>
  <div className="album-bottom"><p className="data-note">ภาพจากอัลบั้มของเพื่อน CS66 · กดที่ภาพเพื่อดูเต็มจอ</p>{limit<filtered.length&&<button className="button secondary" onClick={()=>setLimit(value=>value+9)}>ดูความทรงจำเพิ่มเติม <span>+{Math.min(9,filtered.length-limit)}</span></button>}</div>
  <Dialog open={!!active} onOpenChange={open=>{if(!open)setActiveId(null);}}><DialogContent className="lightbox-dialog real-lightbox" showCloseButton={false}><DialogClose className="thai-dialog-close" aria-label="ปิดหน้าต่าง"><X size={20}/></DialogClose>{active&&<>
   <div className="lightbox-heading"><DialogTitle>{active.title}</DialogTitle><DialogDescription>{active.albumLabel} · {active.caption}</DialogDescription></div>
   <div className="lightbox-image"><img src={active.image} alt={active.title}/><button className="icon-button prev" aria-label="ภาพก่อนหน้า" onClick={()=>step(-1)}><ChevronLeft/></button><button className="icon-button next" aria-label="ภาพถัดไป" onClick={()=>step(1)}><ChevronRight/></button></div>
   <div className="lightbox-footer"><span aria-live="polite">ภาพที่ {activeIndex+1} จาก {filtered.length} · {album==='all'?'ทุกอัลบั้ม':active.albumLabel}</span><span>ใช้ปุ่ม ← → เพื่อเปลี่ยนภาพ · Esc เพื่อปิด</span></div>
  </>}</DialogContent></Dialog>
 </section>;
}
