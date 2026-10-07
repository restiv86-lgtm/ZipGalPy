"use client";

import { useEffect, useId, useRef, useState } from "react";
import { emptyLabelFields, type LabelFields, type LabelRecognition } from "@/lib/product-label/extract";
import styles from "./product-label.module.css";

const labels: Record<keyof LabelFields,string>={brand:"제조사",name:"제품명",modelName:"모델명",manufacturedAt:"제조일자",serialNumber:"시리얼번호",category:"카테고리 제안"};
const categories={APPLIANCE:"가전",FURNITURE:"가구",KITCHEN:"주방",HOUSEHOLD:"생활용품",DIGITAL:"디지털",HOBBY:"취미",CHILDCARE:"육아",OTHER:"기타"};
export function ProductLabelCapture({onApply,disabled=false}:{onApply:(fields:LabelFields,file:File)=>void;disabled?:boolean}) {
  const inputId=useId();
  const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0);
  const [message,setMessage]=useState(""),[result,setResult]=useState<LabelRecognition|null>(null);
  const [fields,setFields]=useState<LabelFields>(emptyLabelFields);
  const controller=useRef<AbortController|null>(null),generation=useRef(0);
  useEffect(()=>()=>{generation.current++;controller.current?.abort();},[]);
  function cancel(){generation.current++;controller.current?.abort();setBusy(false);setMessage("인식을 취소했습니다. 직접 입력할 수 있습니다.");}
  async function recognize() {
    if(!file)return;
    const active=++generation.current;
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    setBusy(true);setMessage("인식 엔진 준비 중입니다. 첫 실행은 시간이 걸릴 수 있습니다.");setResult(null);setProgress(0);
    const timeout=setTimeout(()=>{if(generation.current===active){cancel();setMessage("인식 시간이 길어 중단했습니다. 사진을 다시 찍거나 직접 입력해 주세요.");}},90_000);
    try {
      const {browserLabelOcr}=await import("@/lib/product-label/browser-ocr");
      const extracted=await browserLabelOcr.recognize(file,abort.signal,value=>{if(generation.current===active){setProgress(value);setMessage("제품 라벨을 읽고 있습니다.");}});
      if(generation.current!==active)return;
      setResult(extracted);setFields(extracted.fields);
      setMessage(Object.values(extracted.fields).some(Boolean)?"아래 제안 내용을 확인·수정한 뒤 등록폼에 반영해 주세요.":"확실히 읽은 정보가 없습니다. 사진을 다시 찍거나 직접 입력해 주세요.");
    } catch(error) {if(generation.current===active)setMessage(error instanceof Error?error.message:"인식하지 못했습니다. 직접 입력해 주세요.");}
    finally {clearTimeout(timeout);if(generation.current===active)setBusy(false);}
  }
  return <section className={styles.panel} aria-labelledby={`${inputId}-title`}>
    <h2 id={`${inputId}-title`}>제품 라벨 사진으로 입력하기</h2>
    <p>명판을 밝고 정면으로 촬영해 주세요. OCR은 기기 안에서 처리하며 외부 AI로 사진을 보내지 않습니다. 확인 후 등록폼에 반영한 사진만 물건 저장 시 비공개 첨부됩니다.</p>
    <label htmlFor={inputId}>저장된 라벨 사진 선택</label>
    <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||disabled}
      onChange={event=>{setFile(event.target.files?.[0]??null);setResult(null);setFields(emptyLabelFields());setMessage("");}} />
    <label htmlFor={`${inputId}-camera`}>카메라로 촬영하기 · 모바일</label>
    <input id={`${inputId}-camera`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy||disabled}
      onChange={event=>{setFile(event.target.files?.[0]??null);setResult(null);setFields(emptyLabelFields());setMessage("");}} />
    <div className={styles.actions}><button type="button" disabled={!file||busy||disabled} onClick={recognize}>라벨 인식하기</button>{busy&&<button type="button" onClick={cancel}>인식 취소</button>}</div>
    {busy&&<progress value={progress} max={100} aria-label="라벨 인식 진행률"/>}
    <p role="status" aria-live="polite">{message}</p>
    {result&&<div className={styles.review}>
      <p>자동인식 제안이며 정확성을 보장하지 않습니다. 제조일자가 일부만 있거나 읽지 못한 값은 비워 둡니다.</p>
      {(Object.keys(labels) as (keyof LabelFields)[]).map(key=><label key={key} htmlFor={`${inputId}-${key}`}>{labels[key]}
        {key==="category"?<select id={`${inputId}-${key}`} value={fields[key]} onChange={event=>setFields({...fields,[key]:event.target.value})}><option value="">제안 없음</option>{Object.entries(categories).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:
          <input id={`${inputId}-${key}`} type={key==="manufacturedAt"?"date":"text"} value={fields[key]} maxLength={key==="brand"?80:120} onChange={event=>setFields({...fields,[key]:event.target.value})} />}
      </label>)}
      <button type="button" disabled={disabled||!file} onClick={()=>{if(file){onApply(fields,file);setMessage("등록폼에 반영 요청했습니다. 입력 내용을 확인한 뒤 물건을 저장해 주세요.");}}}>확인한 정보를 등록폼에 반영</button>
      <details><summary>읽은 원문 확인</summary><pre>{result.text.slice(0,6000)}</pre></details>
    </div>}
    <small>JPG/PNG/WebP · 최대 10MB. 인식 없이 기존 등록폼을 직접 작성할 수도 있습니다.</small>
  </section>;
}
