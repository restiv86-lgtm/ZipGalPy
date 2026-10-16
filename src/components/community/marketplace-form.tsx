"use client";
import {useRef,useState} from "react";

import {useRouter} from "next/navigation";
import {FormattedCurrencyInput} from "@/components/ui/formatted-inputs";
import {marketplaceHref,marketplaceLabel,type MarketplaceLink} from "@/lib/community/marketplace-state";
import styles from "@/app/apartments/[id]/community/community.module.css";
import nav from "./navigation.module.css";
type Source={id:string;homeId:string;name:string;brand:string|null;modelName:string|null;type:string};
export function MarketplaceForm({apartmentId,source,existingPost}:{apartmentId:string;source?:Source;existingPost?:MarketplaceLink}){
  const router=useRouter(),lock=useRef(false),requestId=useRef<string|null>(null);
  const [type,setType]=useState(source?.type??"SELL"),[price,setPrice]=useState(source?.type==="GIVEAWAY"?"0":""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[result,setResult]=useState<{post:MarketplaceLink;reused:boolean}|null>(existingPost?{post:existingPost,reused:true}:null);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(lock.current||result)return;lock.current=true;setBusy(true);setError("");requestId.current??=crypto.randomUUID();
    try{const form=new FormData(event.currentTarget),response=await fetch(`/api/apartments/${apartmentId}/marketplace`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,title:form.get("title"),description:form.get("description"),price:type==="GIVEAWAY"?0:Number(price),sourceHomeItemId:source?.id,requestId:requestId.current})});const data=await response.json();if(!response.ok){setError(data.message??"등록하지 못했습니다. 다시 확인해 주세요.");return;}setResult({post:data.post,reused:data.reused===true});router.refresh();}
    catch{setError("등록 결과를 확인하지 못했습니다. 같은 화면에서 다시 시도하면 이미 등록된 글을 확인하며 중복으로 만들지 않습니다.");}
    finally{setBusy(false);lock.current=false;}
  }
  if(result)return <section className={nav.successPanel} aria-live="polite"><span aria-hidden="true">✓</span><h2>{result.reused?"이미 등록된 글이 있습니다":`${result.post.type==="GIVEAWAY"?"나눔":"판매"} 등록이 완료됐습니다`}</h2><p><strong>{marketplaceLabel(result.post)}</strong> · {result.reused?"새 글을 추가하지 않았습니다.":"물건 목록·상세에서도 등록 상태를 확인할 수 있습니다."}</p><p>등록·예약은 물건의 사용 상태와 별개이며, 거래완료 시에만 판매완료·나눔완료로 바뀝니다.</p><div className={nav.successActions}><a className={nav.primary} href={marketplaceHref(result.post)}>등록된 글 확인</a>{source&&<a className={nav.secondary} href={`/homes/${source.homeId}/items/${source.id}`}>원물건과 등록 상태 보기</a>}<a className={nav.secondary} href={`/apartments/${result.post.apartmentId}/marketplace`}>장터 목록으로</a></div></section>;
  const intro=source?`${source.name}${[source.brand,source.modelName].filter(Boolean).length?` (${[source.brand,source.modelName].filter(Boolean).join(" · ")})`:""}`:"";
  return <form className={styles.form} onSubmit={submit} aria-busy={busy}><fieldset disabled={busy} style={{border:0,padding:0,margin:0,minWidth:0,display:"grid",gap:8}}><label htmlFor="type">거래 유형</label><select id="type" name="type" value={type} onChange={e=>{const next=e.target.value;setType(next);setPrice(next==="GIVEAWAY"?"0":"");}}><option value="SELL">판매</option><option value="GIVEAWAY">나눔</option></select><label htmlFor="title">제목</label><input id="title" name="title" minLength={2} maxLength={120} defaultValue={source?.name} required/><label htmlFor="price">가격</label><FormattedCurrencyInput id="price" name="price" aria-label="장터 가격" min={type==="SELL"?1:0} max={2000000000} value={price} onValueChange={setPrice} disabled={type==="GIVEAWAY"} required/><label htmlFor="description">공개 설명</label><textarea id="description" name="description" minLength={2} maxLength={5000} defaultValue={intro} required/><p className={styles.meta}>구매가격·개인 메모·주소·보증정보는 공개되지 않습니다. 진행 중인 원물건 글이 있으면 기존 글로 연결합니다.</p>{error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} disabled={busy}>{busy?"등록 확인 중…":"내용 확인 후 등록하기"}</button></fieldset></form>;
}
