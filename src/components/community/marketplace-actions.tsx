"use client";
import {useRef,useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {marketplaceHref,marketplaceLabel,type MarketplaceLink} from "@/lib/community/marketplace-state";
import styles from "@/app/apartments/[id]/community/community.module.css";
const states=["ACTIVE","RESERVED","COMPLETED","CANCELLED"];
export function MarketplaceActions({apartmentId,postId,type="SELL",status="ACTIVE",revision,itemHref,otherActiveCount=0}:{apartmentId:string;postId:string;type?:string;status?:string;revision?:string;itemHref?:string;otherActiveCount?:number}){
  const router=useRouter(),lock=useRef(false);
  const [error,setError]=useState(""),[busy,setBusy]=useState(false),[pending,setPending]=useState<string|null>(null),[notice,setNotice]=useState(""),[conflict,setConflict]=useState<MarketplaceLink|null>(null);
  const [ack,setAck]=useState<{target:string;from:string;revision?:string}|null>(null),[failed,setFailed]=useState<{target:string;from:string;uncertain:boolean}|null>(null);
  const [refreshing,startRefresh]=useTransition(),locked=busy||refreshing;
  const current=ack&&ack.from===status&&ack.revision===revision?ack.target:status;
  function successMessage(next:string){const subject=type==="GIVEAWAY"?"나눔이":"판매가";return `${subject} ${next==="CANCELLED"?"취소되었습니다":next==="COMPLETED"?"완료되었습니다":next==="RESERVED"?"예약중으로 변경되었습니다":"진행중으로 변경되었습니다"}.`;}
  const confirmedAfterReload=failed?.uncertain&&status===failed.target&&status!==failed.from;
  const success=confirmedAfterReload?successMessage(failed.target):ack?.target===current?notice:"";
  const visibleError=confirmedAfterReload?"":error;
  async function change(next:string){
    if(lock.current||refreshing||current===next)return;
    if(next==="COMPLETED"&&!window.confirm("거래완료로 바꿀까요? 연결된 물건도 판매완료·나눔완료로 변경됩니다."))return;
    lock.current=true;setBusy(true);setPending(next);setError("");setNotice("");setFailed(null);setConflict(null);
    try{
      const response=await fetch(`/api/apartments/${apartmentId}/marketplace/${postId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})}),data=await response.json();
      if(!response.ok){setError((data.message??"거래 상태를 바꾸지 못했습니다.")+" 상태를 확인한 뒤 다시 시도해 주세요.");setFailed({target:next,from:current,uncertain:false});if(data.post)setConflict(data.post);return;}
      const confirmed=data.status??next;if(data.ok!==true||!states.includes(confirmed))throw new Error("Unconfirmed response");
      setAck({target:confirmed,from:status,revision});setNotice(successMessage(confirmed));startRefresh(()=>router.refresh());
    }catch{setError("요청 결과를 확인하지 못했습니다. 현재 상태를 다시 확인하거나 같은 요청을 재시도해 주세요.");setFailed({target:next,from:current,uncertain:true});startRefresh(()=>router.refresh());}
    finally{lock.current=false;setBusy(false);setPending(null);}
  }
  const feedback=success||(busy?`${marketplaceLabel({type,status:pending??current})} 처리 중입니다.`:refreshing?"현재 상태를 다시 확인하고 있습니다.":"");
  return <div aria-busy={locked}><p className={styles.meta}>현재 상태: <strong>{marketplaceLabel({type,status:current})}</strong>. 등록·예약·취소는 사용 상태를 바꾸지 않습니다. 거래완료만 원물건의 상태를 변경하며, 이후 취소해도 사용 상태를 자동으로 되돌리지 않습니다.</p><p role="status" aria-live="polite" aria-atomic="true">{feedback}</p>{current==="CANCELLED"&&otherActiveCount>0&&<p>이 글은 취소됐지만 같은 물건의 다른 진행 글 {otherActiveCount}건은 남아 있습니다.</p>}<div className={styles.actions}>{states.map(next=><button key={next} type="button" className={next==="COMPLETED"?styles.primary:next==="CANCELLED"?styles.danger:styles.secondary} disabled={locked||current===next} onClick={()=>change(next)}>{busy&&pending===next?`${marketplaceLabel({type,status:next})} 처리 중…`:marketplaceLabel({type,status:next})}</button>)}</div>{visibleError&&<div><p className={styles.error} role="alert">{visibleError}</p><button type="button" className={styles.secondary} disabled={locked} onClick={()=>startRefresh(()=>router.refresh())}>현재 상태 다시 확인</button>{failed&&current!==failed.target&&<button type="button" className={styles.secondary} disabled={locked} onClick={()=>change(failed.target)}>같은 요청 다시 시도</button>}</div>}{conflict&&<a href={marketplaceHref(conflict)}>진행 중인 {marketplaceLabel(conflict)} 글 확인</a>}{success&&<p><a href={`/apartments/${apartmentId}/marketplace${current==="CANCELLED"?"?status=CANCELLED":""}`}>갱신된 {current==="CANCELLED"?"취소 글":"장터"} 목록 확인</a></p>}{itemHref&&<p><a href={itemHref}>원물건의 갱신된 상태 확인</a></p>}</div>;
}
