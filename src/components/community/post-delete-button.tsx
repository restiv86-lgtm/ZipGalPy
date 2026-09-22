"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/apartments/[id]/community/community.module.css";

export function PostDeleteButton({ apartmentId, postId }: { apartmentId: string; postId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function remove() {
    if (!window.confirm("게시글을 삭제할까요?")) return;
    const response = await fetch(`/api/apartments/${apartmentId}/community/posts/${postId}`, { method: "DELETE" });
    if (!response.ok) { setError((await response.json()).message ?? "삭제하지 못했습니다."); return; }
    router.push(`/apartments/${apartmentId}/community/posts`);
    router.refresh();
  }
  return <><button className={styles.danger} type="button" onClick={remove}>삭제</button>{error && <span className={styles.error} role="alert">{error}</span>}</>;
}
