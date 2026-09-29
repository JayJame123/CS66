'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Camera, ChevronLeft, ChevronRight, X, Upload, Trash2 } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { albums, memories } from '@/data/memories';
import { getAllMemories, deleteCustomMemory, subscribeToMemories, type MemoryItem } from '@/lib/memory-storage';
import { UploadMemoryModal } from '@/components/upload-memory-modal';

export default function MemoriesGallery() {
 const [album,setAlbum]=useState('all');
 const [limit,setLimit]=useState(18);
 const [activeId,setActiveId]=useState<string|null>(null);
 const [allMemories,setAllMemories]=useState<MemoryItem[]>(memories);
 const [uploadModalOpen,setUploadModalOpen]=useState(false);

 useEffect(()=>{
  queueMicrotask(()=>setAllMemories(getAllMemories()));
  const unsubscribe = subscribeToMemories((updated)=>setAllMemories(updated));
  return ()=>unsubscribe();
 },[]);

 const filtered=useMemo(()=>allMemories.filter(photo=>album==='all'||photo.album===album),[allMemories,album]);
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
  <div className="section-heading">
   <div>
    <div className="section-kicker">03 — ช่วงเวลาดี ๆ ของพวกเรา</div>
    <h2 className="section-title">วันธรรมดา<span>ที่คิดถึง</span></h2>
    <p className="muted">จากวันแรกที่รู้จักกัน ถึงทุกทริปและทุกเสียงหัวเราะ</p>
   </div>
   <div className="flex items-center gap-3">
    <span className="section-note"><Camera size={17}/>{allMemories.length} ภาพ · 4 อัลบั้มความทรงจำ</span>
   </div>
  </div>

  <div className="album-toolbar">
   <div className="filters album-filters" aria-label="เลือกอัลบั้มภาพ">
    {albums.map(item=><button key={item.id} aria-pressed={album===item.id} className={album===item.id?'active':''} onClick={()=>{setAlbum(item.id);setLimit(18);}}>{item.label}<span>{item.id==='all'?allMemories.length:allMemories.filter(photo=>photo.album===item.id).length}</span></button>)}
   </div>
   <div className="action-toolbar">
    <p className="muted album-count" aria-live="polite">{filtered.length} ภาพที่บันทึกไว้</p>
    <button type="button" onClick={()=>setUploadModalOpen(true)} className="add-member-button" style={{padding:'7px 14px',fontSize:'12px'}}>
     <Upload size={14}/> อัปโหลดภาพกิจกรรม
    </button>
   </div>
  </div>

  <div className="album-grid">
   {filtered.slice(0,limit).map((photo,i)=><button key={photo.id} className="album-photo" onClick={()=>setActiveId(photo.id)} aria-label={`เปิดภาพ ${photo.title}`}>
    <div className="album-image">
     <img src={photo.image} alt={photo.title} loading="lazy"/>
     <span className="album-number">{String(i+1).padStart(2,'0')}</span>
     <span className="album-open"><ArrowUpRight size={18}/></span>
    </div>
    <div className="album-caption">
     <small>{photo.albumLabel}</small>
     <h3>{photo.title}</h3>
    </div>
   </button>)}
  </div>

  <div className="album-bottom">
   <p className="data-note">ภาพกิจกรรมจากเพื่อน CS66 รวม {allMemories.length} ภาพ · กดที่ภาพเพื่อเปิดดูขนาดใหญ่</p>
   {limit<filtered.length&&<button className="button secondary" onClick={()=>setLimit(value=>value+18)}>ดูความทรงจำเพิ่มเติม <span>+{Math.min(18,filtered.length-limit)}</span></button>}
  </div>

  <Dialog open={!!active} onOpenChange={open=>{if(!open)setActiveId(null);}}>
   <DialogContent className="lightbox-dialog real-lightbox" showCloseButton={false}>
    <DialogClose className="thai-dialog-close" aria-label="ปิดหน้าต่าง"><X size={20}/></DialogClose>
    {active&&<>
     <div className="lightbox-heading flex items-center justify-between gap-4">
      <div>
       <DialogTitle>{active.title}</DialogTitle>
       <DialogDescription>{active.albumLabel} · {active.caption}</DialogDescription>
      </div>
      {active.custom&&<button type="button" onClick={()=>{if(confirm('คุณต้องการลบภาพนี้ออกจากแกลเลอรีหรือไม่?')){deleteCustomMemory(active.id);setActiveId(null);}}} className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs flex items-center gap-1.5 transition-colors shrink-0"><Trash2 size={13}/> ลบภาพนี้</button>}
     </div>
     <div className="lightbox-image">
      <img src={active.image} alt={active.title}/>
      <button className="icon-button prev" aria-label="ภาพก่อนหน้า" onClick={()=>step(-1)}><ChevronLeft/></button>
      <button className="icon-button next" aria-label="ภาพถัดไป" onClick={()=>step(1)}><ChevronRight/></button>
     </div>
     <div className="lightbox-footer">
      <span aria-live="polite">ภาพที่ {activeIndex+1} จาก {filtered.length} · {album==='all'?'ทุกอัลบั้ม':active.albumLabel}</span>
      <span>ใช้ปุ่ม ← → เพื่อเปลี่ยนภาพ · Esc เพื่อปิด</span>
     </div>
    </>}
   </DialogContent>
  </Dialog>

  <UploadMemoryModal
   open={uploadModalOpen}
   onOpenChange={setUploadModalOpen}
   defaultAlbum={album}
   onSuccess={()=>setAllMemories(getAllMemories())}
  />
 </section>;
}

