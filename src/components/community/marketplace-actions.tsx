"use client";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";

import {marketplaceHref,marketplaceLabel,type MarketplaceLink} from "@/lib/community/marketplace-state";
import styles from "@/app/apartments/[id]/community/community.module.css";
export function MarketplaceActions({apartmentId,postId,type="SELL",status="ACTIVE"}:{apartmentId:string;postId:string;type?:string;status?:string}){
  const router=useRouter(),lock=useRef(false);const [error,setError]=useState(""),[busy,setBusy]=useState(false),[conflict,setConflict]=useState<MarketplaceLink|null>(null);
  const [refreshing,startRefresh]=useTransition();const current=status,locked=busy||refreshing;
  async function change(next:string){if(lock.current||refreshing||current===next)return;if(next==="COMPLETED"&&!window.confirm("거래완료로 바꿀까요? 연결된 물건도 판매완료·나눔완료로 변경됩니다."))return;lock.current=true;setBusy(true);setError("");setConflict(null);
    try{const response=await fetch(`/api/apartments/${apartmentId}/marketplace/${postId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})}),data=await response.json();if(!response.ok){setError(data.message??"거래 상태를 바꾸지 못했습니다.");if(data.post)setConflict(data.post);return;}startRefresh(()=>router.refresh());}catch{setError("상태 변경 결과를 확인하지 못했습니다. 갱신된 화면을 확인해 주세요.");startRefresh(()=>router.refresh());}finally{lock.current=false;setBusy(false);}}
  return <div aria-busy={locked}><p className={styles.meta}>현재 상태: <strong>{marketplaceLabel({type,status:current})}</strong>. 등록·예약·취소는 사용 상태를 바꾸지 않습니다. 거래완료만 원물건의 상태를 변경하며, 이후 취소해도 사용 상태를 자동으로 되돌리지 않습니다.</p><div className={styles.actions}>{["ACTIVE","RESERVED","COMPLETED","CANCELLED"].map(next=><button key={next} type="button" className={next==="COMPLETED"?styles.primary:next==="CANCELLED"?styles.danger:styles.secondary} disabled={locked||current===next} onClick={()=>change(next)}>{marketplaceLabel({type,status:next})}</button>)}</div>{error&&<p className={styles.error} role="alert">{error}</p>}{conflict&&<a href={marketplaceHref(conflict)}>진행 중인 {marketplaceLabel(conflict)} 글 확인</a>}</div>;
}
