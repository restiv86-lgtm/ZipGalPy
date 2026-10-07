"use client";

import { useEffect, useId, useRef, useState } from "react";
import { type LabelFields, type LabelRecognition } from "@/lib/product-label/extract";
import type { LabelProposal } from "@/lib/product-label/autofill";
import styles from "./product-label.module.css";
import { compareLabelResults, labelKeys, shouldOfferAi, type AiLabelResponse } from "@/lib/product-label/ai";

const labels: Record<keyof LabelFields,string>={brand:"제조사",name:"제품명",modelName:"모델명",manufacturedAt:"제조일자",serialNumber:"시리얼번호",category:"카테고리 제안"};
const categories={APPLIANCE:"가전",FURNITURE:"가구",KITCHEN:"주방",HOUSEHOLD:"생활용품",DIGITAL:"디지털",HOBBY:"취미",CHILDCARE:"육아",OTHER:"기타"};
export function ProductLabelCapture({onAnalyzed,onDiscard,disabled=false}:{onAnalyzed:(suggestions:Partial<Record<keyof LabelFields,LabelProposal>>)=>void;onDiscard:()=>void;disabled?:boolean}) {
  const inputId=useId();
  const [file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[progress,setProgress]=useState(0);
  const [message,setMessage]=useState(""),[result,setResult]=useState<LabelRecognition|null>(null);
  const controller=useRef<AbortController|null>(null),generation=useRef(0);
  const [aiEnabled,setAiEnabled]=useState(false),[showConsent,setShowConsent]=useState(false),[consent,setConsent]=useState(false),[aiBusy,setAiBusy]=useState(false),[aiResult,setAiResult]=useState<AiLabelResponse|null>(null);
  const aiController=useRef<AbortController|null>(null),aiLock=useRef(false);
  const [aiTimedOut,setAiTimedOut]=useState(false);
  useEffect(()=>{const abort=new AbortController();fetch("/api/product-label/analyze",{signal:abort.signal,cache:"no-store"}).then(response=>response.ok?response.json():null).then(config=>{if(config)setAiEnabled(config.enabled===true);}).catch(()=>undefined);return()=>{abort.abort();aiController.current?.abort();};},[]);
  function resetAi(){setAiTimedOut(false);setShowConsent(false);setConsent(false);setAiResult(null);aiController.current?.abort();}
  async function analyzeAi(){
    if(!file||!result||!consent||aiLock.current)return;
    aiLock.current=true;setAiBusy(true);setAiTimedOut(false);setMessage("제품 정보를 분석하고 있습니다...");
    const active=generation.current;const abort=new AbortController();aiController.current=abort;
    try{
      const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40_000_000){bitmap.close();throw new Error("사진 크기를 줄여 주세요.");}
      const canvas=document.createElement("canvas"),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
      const context=canvas.getContext("2d");if(!context){bitmap.close();throw new Error("사진을 읽지 못했습니다. 직접 입력해 주세요.");}
      context.fillStyle="white";context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
      const cleaned=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,"image/jpeg",.92));canvas.width=0;canvas.height=0;
      if(!cleaned||cleaned.size>3_000_000)throw new Error("라벨 부분만 잘라 3MB 이하로 다시 선택해 주세요.");
      const form=new FormData();form.set("image",cleaned,"label.jpg");form.set("consent","label-ai-v1");form.set("requestId",crypto.randomUUID());
      const response=await fetch("/api/product-label/analyze",{method:"POST",body:form,signal:AbortSignal.any([abort.signal,AbortSignal.timeout(230_000)])});
      if(response.status===504){await response.body?.cancel();throw new Error("AI 분석 시간이 초과되었습니다.");}
      const data=await response.json();
      if(!response.ok)throw new Error(data.error??"AI 분석에 실패했습니다. 직접 입력할 수 있습니다.");
      if(generation.current===active){
        const comparison=compareLabelResults(result,data.label);
        onAnalyzed(Object.fromEntries(labelKeys.map(key=>[key,{value:comparison[key].ai,confidence:comparison[key].confidence}])));
        setAiResult(data);setShowConsent(false);setConsent(false);setMessage("AI의 HIGH/MEDIUM 결과는 빈 입력칸에만 반영했습니다. 확인 필요 표시를 확인하고 수정해 주세요. 자동 저장되지 않습니다.");
      }
    }catch(error){if(generation.current===active){const timedOut=error instanceof Error&&(error.name==="TimeoutError"||error.message==="AI 분석 시간이 초과되었습니다.");setAiTimedOut(timedOut);if(timedOut){setShowConsent(false);setConsent(false);}setMessage(timedOut?"AI 분석 시간이 초과되었습니다.":error instanceof Error?error.message:"AI 분석에 실패했습니다. 수동 입력을 유지합니다.");}}
    finally{aiLock.current=false;setAiBusy(false);}
  }
  useEffect(()=>()=>{generation.current++;controller.current?.abort();},[]);
  function cancel(){generation.current++;controller.current?.abort();resetAi();setBusy(false);setResult(null);onDiscard();setMessage("분석 결과를 취소했습니다. 기존 입력과 직접 수정한 값은 유지합니다.");}
  async function recognize() {
    if(!file)return;
    const active=++generation.current;
    controller.current?.abort();const abort=new AbortController();controller.current=abort;
    resetAi();setBusy(true);setMessage("인식 엔진 준비 중입니다. 첫 실행은 시간이 걸릴 수 있습니다.");setResult(null);setProgress(0);
    const timeout=setTimeout(()=>{if(generation.current===active){cancel();setMessage("인식 시간이 길어 중단했습니다. 사진을 다시 찍거나 직접 입력해 주세요.");}},90_000);
    try {
      const {browserLabelOcr}=await import("@/lib/product-label/browser-ocr");
      const extracted=await browserLabelOcr.recognize(file,abort.signal,value=>{if(generation.current===active){setProgress(value);setMessage("제품 라벨을 읽고 있습니다.");}});
      if(generation.current!==active)return;
      setResult(extracted);onAnalyzed(extracted.suggestions);
      setMessage(Object.values(extracted.suggestions).some(suggestion=>suggestion.value)?"HIGH/MEDIUM은 빈 입력칸에만 반영했습니다. LOW는 후보로만 표시합니다. 등록 전 확인하고 수정해 주세요.":"확실히 읽은 정보가 없습니다. 사진을 다시 찍거나 직접 입력해 주세요.");
    } catch(error) {if(generation.current===active)setMessage(error instanceof Error?error.message:"인식하지 못했습니다. 직접 입력해 주세요.");}
    finally {clearTimeout(timeout);if(generation.current===active)setBusy(false);}
  }
  return <section className={styles.panel} aria-labelledby={`${inputId}-title`} aria-busy={busy||aiBusy}>
    <h2 id={`${inputId}-title`}>제품 라벨 사진으로 입력하기</h2>
    <p>명판을 밝고 정면으로 촬영해 주세요. HIGH/MEDIUM은 빈 입력칸만 채우며 기존 입력은 바꾸지 않습니다. LOW는 후보로만 표시합니다. 1차 OCR은 기기 안에서 처리하며 AI는 직접 선택하고 동의한 경우에만 사진을 외부로 전송합니다. 분석만으로 정보나 사진이 저장되지 않습니다.</p>
    <label htmlFor={inputId}>저장된 라벨 사진 선택</label>
    <input id={inputId} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||aiBusy||disabled}
      onChange={event=>{generation.current++;resetAi();onDiscard();setFile(event.target.files?.[0]??null);setResult(null);setMessage("");}} />
    <label htmlFor={`${inputId}-camera`}>카메라로 촬영하기 · 모바일</label>
    <input id={`${inputId}-camera`} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={busy||aiBusy||disabled}
      onChange={event=>{generation.current++;resetAi();onDiscard();setFile(event.target.files?.[0]??null);setResult(null);setMessage("");}} />
    <div className={styles.actions}><button type="button" disabled={!file||busy||aiBusy||disabled} onClick={recognize}>라벨 인식하기</button>{busy&&<button type="button" onClick={cancel}>인식 취소</button>}</div>
    {busy&&<progress value={progress} max={100} aria-label="라벨 인식 진행률"/>}
    <p role="status" aria-live="polite">{message}</p>
    {result&&aiEnabled&&shouldOfferAi(result)&&!aiResult&&<div className={styles.actions}><button type="button" disabled={busy||aiBusy||disabled} onClick={()=>{setShowConsent(true);setConsent(false);}}>{aiTimedOut?"다시 분석":"AI로 더 정확하게 분석"}</button></div>}
    {showConsent&&<section aria-label="외부 AI 전송 동의"><h3>사진 외부 전송 안내</h3><p>선택한 사진이 Google Gemini 유료 API로 전송됩니다. 시리얼번호나 사진에 보이는 개인정보가 포함될 수 있습니다. 불필요한 주소·전화번호는 가리거나 라벨만 촬영해 주세요. EXIF/GPS는 제거하며 계정 이메일·Home 주소·비용·계약 데이터를 추가로 보내지 않습니다. 외부 서비스는 안전성 점검 등을 위해 제한적으로 보관할 수 있습니다. 결과는 제안이며 자동 저장되지 않습니다.</p><label style={{display:"flex",alignItems:"center",gap:8}}><input type="checkbox" checked={consent} disabled={aiBusy} onChange={event=>setConsent(event.target.checked)} style={{width:20,minHeight:20,flex:"0 0 20px"}}/>사진을 Gemini로 전송하는 것에 동의합니다.</label><p>Preview 전체 하루 20회 · 한국시간 기준 · 실패 요청도 한도에 포함 · 503 오류에만 최대 2회 재시도 · 재시도도 한도에 포함</p><div className={styles.actions}><button type="button" disabled={!consent||aiBusy||disabled} onClick={analyzeAi}>{aiBusy?"AI 분석 중…":"동의하고 AI 분석 1회"}</button><button type="button" disabled={aiBusy} onClick={()=>setShowConsent(false)}>취소 · 직접 입력</button></div></section>}
    {aiResult&&result&&<section aria-label="OCR과 AI 결과 비교"><h3>AI 결과 비교</h3><p>기존 입력과 수동 수정값은 유지합니다. 반영된 값은 아래 물건 입력칸에서 수정하세요.</p>{labelKeys.map(key=>{const comparison=compareLabelResults(result,aiResult.label)[key];return <div key={key}><h4>{labels[key]} · {comparison.agreement==="MATCH"?"일치 확인":comparison.agreement==="DIFFERENT"?"결과 다름 · 확인 필요":"확인 필요"}</h4><p>OCR: {comparison.ocr||"미추출"}<br/>AI: {key==="category"&&comparison.ai?categories[comparison.ai as keyof typeof categories]:comparison.ai||"미추출"}</p><small>사진 근거: {comparison.evidence||"없음"} · {comparison.confidence}</small></div>;})}<p>남은 일일 한도: {aiResult.remaining}회 · 이번 요청 예상 API 비용: {aiResult.usage.estimatedUsd===null?"확인 불가":"$"+aiResult.usage.estimatedUsd.toFixed(6)}</p></section>}
    {result&&<div className={styles.review}>
      <p>반영된 정보는 아래 물건 등록폼에서 자유롭게 수정할 수 있습니다. MEDIUM은 입력칸의 ‘확인 필요’ 표시를 확인해 주세요.</p>
      <section className={styles.candidates} aria-label="확인 필요 후보">
        <h3>낮은 신뢰도 후보 · 자동 반영 안 함</h3>
        <p>사진과 비교해 주세요. 필요한 값만 아래 입력칸에 직접 입력하거나 무시하세요.</p>
        {(Object.keys(labels) as (keyof LabelFields)[]).filter(key=>result.suggestions[key].value&&result.suggestions[key].confidence==="LOW").map(key=>{
          const suggestion=result.suggestions[key];
          return <article className={styles.candidate} key={key} aria-label={`${labels[key]} 후보`}>
            <h4>{labels[key]} 후보</h4>
            <strong>{key==="category"?categories[suggestion.value as keyof typeof categories]:suggestion.value}</strong>
            <p>{suggestion.confidence==="LOW"?"신뢰도 낮음":"확인 필요"} · 사진과 비교해 주세요</p>
            <small>{suggestion.reason}</small>
          </article>;
        })}
        {!Object.values(result.suggestions).some(suggestion=>suggestion.value&&suggestion.confidence==="LOW")&&<p>낮은 신뢰도 후보가 없습니다.</p>}
      </section>
      <button type="button" className={styles.secondary} disabled={disabled||aiBusy} onClick={cancel}>분석 결과 취소 · 자동 반영 되돌리기</button>
      <details><summary>인식된 글자 보기</summary><pre>{result.text.slice(0,6000)}</pre></details>
    </div>}
    <small>JPG/PNG/WebP · 최대 10MB. 인식 없이 기존 등록폼을 직접 작성할 수도 있습니다.</small>
  </section>;
}
