"use client";

import Image from "next/image";
import {forwardRef,useEffect,useId,useImperativeHandle,useRef,useState} from "react";
import {attachItemLabel} from "@/lib/attachments/upload-client";
import {ItemPhotoDraft,type DraftPhoto,type ItemImage,type PhotoSavePorts} from "@/lib/attachments/item-photo-draft";
import styles from "./item-photos.module.css";

async function request(url:string,options?:RequestInit){const r=await fetch(url,options);if(options?.method==="DELETE"&&r.status===404)return{};const data=await r.json();if(!r.ok)throw new Error(data.error||"사진 변경을 저장하지 못했습니다.");return data;}
const ports:PhotoSavePorts={
  list:id=>request(`/api/attachments?type=item&id=${encodeURIComponent(id)}`,{cache:"no-store"}),
  upload:attachItemLabel,
  remove:id=>request(`/api/attachments/${id}`,{method:"DELETE"}),
  purpose:(id,purpose)=>request(`/api/attachments/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({purpose})}),
  order:(id,ids)=>request("/api/attachments/order",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({target:{type:"item",id},ids})}),
};
export type ItemPhotoEditorHandle={prepare:()=>Promise<void>;save:(itemId:string)=>Promise<void>;add:(file:File)=>void;selectLabel:(file:File|null,sourceId?:string)=>Promise<void>;discardLabel:()=>void};
export const ItemPhotoEditor=forwardRef<ItemPhotoEditorHandle,{itemId?:string;disabled:boolean;children:React.ReactNode;onImagesChange?:(images:ItemImage[])=>void;onOpenLabel?:()=>void}>(function ItemPhotoEditor({itemId,disabled,children,onImagesChange,onOpenLabel},ref){
  const inputId=useId(),draftRef=useRef<ItemPhotoDraft|null>(null);if(!draftRef.current)draftRef.current=new ItemPhotoDraft();const draft=draftRef.current;
  const [photos,setPhotos]=useState<DraftPhoto[]>([]),[message,setMessage]=useState(""),[loading,setLoading]=useState(!!itemId);
  const pending=useRef(Promise.resolve()),committing=useRef(false),alive=useRef(true);
  function publish(){if(alive.current){setPhotos([...draft.visible]);onImagesChange?.(draft.savedImages);}}
  useEffect(()=>{const abort=new AbortController();if(itemId)ports.list(itemId).then(data=>{if(!abort.signal.aborted){draft.load(data.files);setPhotos([...draft.visible]);onImagesChange?.(draft.savedImages);setLoading(false);}}).catch(error=>{if(!abort.signal.aborted)setMessage(error.message||"사진을 불러오지 못했습니다. 새로고침해 주세요.");});return()=>abort.abort();},[itemId,draft,onImagesChange]);
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;draft.dispose();};},[draft]);
  function enqueue(action:()=>void|Promise<void>){const next=pending.current.then(()=>{if(alive.current)return action();});pending.current=next.catch(()=>undefined);return next.finally(publish);}
  function add(file:File){if(loading||committing.current||disabled)return;void enqueue(()=>draft.add(file)).then(()=>setMessage("저장하기 전에는 물건과 사진이 서버에 저장되지 않습니다.")).catch(error=>setMessage(error.message));}
  useImperativeHandle(ref,()=>({add,async prepare(){await pending.current;if(loading)throw new Error("기존 첨부를 불러온 뒤 저장해 주세요.");draft.assertLimit();},async selectLabel(file,sourceId){if(loading||committing.current)throw new Error("사진을 불러오거나 저장하는 중입니다.");await enqueue(()=>file?draft.add(file,"LABEL",sourceId):draft.discardLabel());setMessage("제품 라벨 사진은 물건을 저장할 때 함께 보관됩니다. 같은 임시 이미지는 한 번만 보관합니다.");},discardLabel(){void enqueue(()=>draft.discardLabel());},async save(id){await pending.current;if(loading)throw new Error("기존 첨부를 불러온 뒤 저장해 주세요.");committing.current=true;try{await draft.save(id,ports);}finally{committing.current=false;publish();}}}));
  function remove(photo:DraftPhoto){draft.remove(photo.key);publish();setMessage("사진 삭제는 물건을 저장할 때 반영됩니다.");}
  function reorder(from:number,to:number){draft.move(from,to);publish();}
  const locked=disabled||loading,products=photos.filter(p=>p.purpose!=="LABEL"),labels=photos.filter(p=>p.purpose==="LABEL");
  return <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
    <div className={styles.heading}><h2 id={`${inputId}-title`}>물건 사진</h2><span className={styles.count}>{photos.length+draft.otherCount} / 10</span></div>
    <p className={styles.help}>제품 사진과 라벨 사진은 구분해 보관합니다.<br/>사진·라벨·PDF를 합쳐 최대 10개이며 변경은 물건 저장 시 반영됩니다.</p>
    <div className={styles.pickers}>
      <label className={`${styles.picker} ${styles.camera}`} htmlFor={`${inputId}-camera`} data-disabled={locked}><span aria-hidden="true">📷</span><strong>사진 촬영</strong><small>휴대폰 카메라 열기</small><input id={`${inputId}-camera`} aria-label="물건 사진 카메라 촬영" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={locked} onChange={e=>{const f=e.target.files?.[0];if(f)add(f);e.target.value="";}}/></label>
      <label className={styles.picker} htmlFor={inputId} data-disabled={locked}><span aria-hidden="true">＋</span><strong>사진 추가</strong><small>앨범에서 여러 장 선택</small><input id={inputId} aria-label="물건 사진 여러 장 선택" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={locked} onChange={e=>{for(const f of e.target.files??[])add(f);e.target.value="";}}/></label>
    </div>
    {loading&&<p role="status">기존 사진과 라벨을 불러오고 있습니다.</p>}
    {!loading&&!products.length&&<div className={styles.empty}><strong>제품 사진을 추가해 주세요</strong><p>첫 번째 제품 사진이 목록의 대표사진입니다. 제품 라벨은 대표사진으로 사용하지 않습니다.</p></div>}
    <div className={styles.grid} aria-label="제품 사진 미리보기">{products.map((p,i)=><article className={`${styles.photo} ${i===0?styles.cover:""}`} key={p.key}><div className={styles.imageWrap}><Image src={p.url} alt={`${i===0?"대표사진: ":""}${p.name}`} width={320} height={220} unoptimized/>{i===0&&<span className={styles.coverBadge}>대표사진</span>}</div><strong className={styles.photoTitle}>제품 사진 {i+1}</strong><div className={styles.actions}><button type="button" disabled={locked||i===0} onClick={()=>reorder(i,0)}>{i===0?"대표사진 선택됨":"대표사진으로"}</button><button type="button" disabled={locked||i===0} onClick={()=>reorder(i,i-1)}>앞으로</button><button type="button" disabled={locked||i===products.length-1} onClick={()=>reorder(i,i+1)}>뒤로</button><button type="button" disabled={locked} onClick={()=>remove(p)}>사진 삭제</button></div></article>)}</div>
    <section aria-label="보관할 제품 라벨"><div className={styles.heading}><h3>제품 라벨 사진</h3><span>{labels.length}장</span></div><p className={styles.help}>라벨 촬영·분석에서 선택한 사진도 물건 저장 시 보관됩니다. 라벨을 지워도 입력한 제품 정보는 유지됩니다.</p><div className={styles.grid}>{labels.map(p=><article className={styles.photo} key={p.key}><Image src={p.url} alt={`제품 라벨: ${p.name}`} width={320} height={220} unoptimized/><strong>{p.id&&!p.replaceId?"저장된 제품 라벨":"저장 대기 중인 제품 라벨"}</strong><div className={styles.actions}>{p.id&&<button type="button" disabled={locked} onClick={()=>{draft.startReplacement(p.id!);publish();setMessage("라벨 촬영·분석에서 새 사진을 선택하면 이 라벨을 교체합니다. 저장 전까지 기존 라벨은 유지됩니다.");onOpenLabel?.();}}>이 라벨 교체</button>}<button type="button" disabled={locked} onClick={()=>remove(p)}>라벨 삭제</button></div></article>)}</div></section>
    <small className={styles.limit}>JPG · PNG · WebP / 이미지당 최대 10MB</small>{message&&<p className={styles.message} role="status">{message}</p>}<div className={styles.labelEntry}>{children}</div>
  </section>;
});
