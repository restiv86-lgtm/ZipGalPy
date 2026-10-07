"use client";

import Image from "next/image";
import {forwardRef, useEffect, useId, useImperativeHandle, useRef, useState} from "react";
import {attachItemLabel} from "@/lib/attachments/upload-client";
import styles from "./item-photos.module.css";

type Photo = {key:string;id?:string;file?:File;url:string;name:string};
export type ItemPhotoEditorHandle = {save:(itemId:string)=>Promise<void>;add:(file:File)=>void};
export const ItemPhotoEditor = forwardRef<ItemPhotoEditorHandle,{itemId?:string;disabled:boolean;children:React.ReactNode}>(function ItemPhotoEditor({itemId,disabled,children},ref){
  const inputId=useId(),[photos,setPhotos]=useState<Photo[]>([]),[message,setMessage]=useState(""),[loading,setLoading]=useState(!!itemId);
  const removed=useRef(new Set<string>()),urls=useRef(new Set<string>()),committing=useRef(false),current=useRef(photos);current.current=photos;
  useEffect(()=>{const abort=new AbortController();if(itemId)fetch(`/api/attachments?type=item&id=${encodeURIComponent(itemId)}`,{signal:abort.signal,cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);return data;}).then(data=>{setPhotos(data.files.filter((file:{mimeType:string})=>file.mimeType.startsWith("image/")).map((file:{id:string;contentUrl:string;fileName:string})=>({key:file.id,id:file.id,url:file.contentUrl,name:file.fileName})));setLoading(false);}).catch(error=>{if(!abort.signal.aborted)setMessage(error.message||"사진을 불러오지 못했습니다. 새로고침해 주세요.");});return()=>abort.abort();},[itemId]);
  useEffect(()=>{const allocated=urls.current;return()=>{for(const url of allocated)URL.revokeObjectURL(url);};},[]);
  function add(file:File){
    if(loading||committing.current)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>10*1024*1024||!file.size){setMessage("JPG/PNG/WebP 사진을 10MB 이하로 선택해 주세요.");return;}
    if(current.current.length>=10){setMessage("사진은 최대 10장입니다. 기존 PDF 등 첨부파일을 포함한 총 한도도 10개입니다.");return;}
    if(current.current.some(photo=>photo.file===file))return;
    const url=URL.createObjectURL(file);urls.current.add(url);const next=[...current.current,{key:crypto.randomUUID(),file,url,name:file.name}];current.current=next;setPhotos(next);setMessage("저장하기 전에는 파일을 서버에 전송하지 않습니다.");
  }
  useImperativeHandle(ref,()=>({add,async save(id){
    if(loading)throw new Error("사진 목록을 불러온 후 저장해 주세요.");
    committing.current=true;
    try{
      for(const attachmentId of [...removed.current]){const response=await fetch(`/api/attachments/${attachmentId}`,{method:"DELETE"});if(!response.ok&&response.status!==404)throw new Error("사진 삭제에 실패했습니다.");removed.current.delete(attachmentId);}
      for(const photo of current.current){if(!photo.id&&photo.file)photo.id=await attachItemLabel(photo.file,id);}
      const response=await fetch("/api/attachments/order",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({target:{type:"item",id},ids:current.current.map(photo=>photo.id)})});
      if(!response.ok){const data=await response.json();throw new Error(data.error||"사진 순서를 저장하지 못했습니다.");}
    }finally{committing.current=false;setPhotos([...current.current]);}
  }}));
  function reorder(from:number,to:number){const next=[...photos];const [photo]=next.splice(from,1);next.splice(to,0,photo);setPhotos(next);}
  function remove(photo:Photo){if(photo.id)removed.current.add(photo.id);if(photo.file){URL.revokeObjectURL(photo.url);urls.current.delete(photo.url);}setPhotos(photos.filter(entry=>entry.key!==photo.key));}
  const locked=disabled||loading;
  return <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
    <div className={styles.heading}><h2 id={`${inputId}-title`}>물건 사진</h2><span className={styles.count} aria-label={`사진 ${photos.length}장`}>{photos.length} / 10</span></div>
    <p className={styles.help}>사진을 촬영하거나 앨범에서 여러 장 선택하세요.<br/>사진 변경사항은 물건을 저장할 때 반영됩니다.</p>
    <div className={styles.pickers}>
      <label className={`${styles.picker} ${styles.camera}`} htmlFor={`${inputId}-camera`} data-disabled={locked}><span aria-hidden="true">📷</span><strong>사진 촬영</strong><small>휴대폰 카메라 열기</small><input id={`${inputId}-camera`} aria-label="물건 사진 카메라 촬영" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={locked} onChange={event=>{const file=event.target.files?.[0];if(file)add(file);event.target.value="";}}/></label>
      <label className={styles.picker} htmlFor={inputId} data-disabled={locked}><span aria-hidden="true">＋</span><strong>사진 추가</strong><small>앨범에서 여러 장 선택</small><input id={inputId} aria-label="물건 사진 여러 장 선택" type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={locked} onChange={event=>{for(const file of event.target.files??[])add(file);event.target.value="";}}/></label>
    </div>
    {loading&&<p role="status">기존 사진을 불러오는 중입니다.</p>}
    {!loading&&photos.length===0&&<div className={styles.empty}><span aria-hidden="true">▧</span><strong>물건 사진을 추가해 보세요</strong><p>첫 번째 사진이 목록에 표시되는 대표사진입니다.</p></div>}
    <div className={styles.grid} aria-label="선택한 사진 미리보기">{photos.map((photo,index)=><article className={`${styles.photo} ${index===0?styles.cover:""}`} key={photo.key}>
      <div className={styles.imageWrap}><Image src={photo.url} alt={`${index===0?"대표사진: ":""}${photo.name}`} width={320} height={220} unoptimized/>{index===0&&<span className={styles.coverBadge}>대표사진</span>}</div>
      <strong className={styles.photoTitle}>사진 {index+1}</strong>
      <div className={styles.actions}><button className={styles.representative} type="button" aria-label={`${photo.name} 대표사진으로 선택`} disabled={locked||index===0} onClick={()=>reorder(index,0)}>{index===0?"대표사진 선택됨":"대표사진으로"}</button><button type="button" aria-label={`사진 ${index+1} 순서를 앞으로 이동`} disabled={locked||index===0} onClick={()=>reorder(index,index-1)}>← 앞</button><button type="button" aria-label={`사진 ${index+1} 순서를 뒤로 이동`} disabled={locked||index===photos.length-1} onClick={()=>reorder(index,index+1)}>뒤 →</button><button className={styles.delete} type="button" aria-label={`사진 ${index+1} 삭제`} disabled={locked} onClick={()=>remove(photo)}>사진 삭제</button></div>
    </article>)}</div>
    {photos.length>1&&<p className={styles.help}>앞·뒤 버튼으로 순서를 바꾸거나 대표사진을 선택하세요.</p>}
    <small className={styles.limit}>JPG · PNG · WebP / 사진당 최대 10MB</small>
    {message&&<p className={styles.message} role="status" aria-live="polite">{message}</p>}
    <div className={styles.labelEntry}>{children}</div></section>;
});
