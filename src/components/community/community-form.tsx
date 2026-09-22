"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/apartments/[id]/community/community.module.css";

type Props={apartmentId:string; post?:{id:string;category:string;title:string;content:string}};
export function CommunityForm({apartmentId,post}:Props){
 const router=useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);const response=await fetch(`/api/apartments/${apartmentId}/community/posts${post?`/${post.id}`:""}`,{method:post?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({category:form.get("category"),title:form.get("title"),content:form.get("content")})});const data=await response.json();setBusy(false);if(!response.ok){setError(data.message??"처리하지 못했습니다.");return}router.push(`/apartments/${apartmentId}/community/posts/${post?.id??data.post.id}`);router.refresh()}
 return <form className={styles.form} onSubmit={submit}><label htmlFor="category">카테고리</label><select id="category" name="category" defaultValue={post?.category??"GENERAL"}><option value="GENERAL">자유게시판</option><option value="QUESTION">질문</option><option value="INFO">정보</option><option value="LOST_AND_FOUND">분실물</option></select><label htmlFor="title">제목</label><input id="title" name="title" defaultValue={post?.title} minLength={2} maxLength={120} required/><label htmlFor="content">내용</label><textarea id="content" name="content" defaultValue={post?.content} minLength={2} maxLength={5000} required/><p className={styles.meta}>이메일, 전화번호, 동·호수 등 개인정보는 작성하지 마세요.</p>{error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.primary} disabled={busy}>{busy?"저장 중…":post?"수정 완료":"게시글 등록"}</button></form>
}
