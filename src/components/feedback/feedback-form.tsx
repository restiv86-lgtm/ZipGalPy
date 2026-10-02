"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./feedback-form.module.css";

export function FeedbackForm({ pageUrl }: { pageUrl: string | null }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: form.get("type"), title: form.get("title"), content: form.get("content"), pageUrl }),
    });
    const data = await response.json().catch(() => ({}));
    setPending(false);
    setMessage(data.message ?? (response.ok ? "의견이 접수되었습니다." : "접수하지 못했습니다."));
    if (response.ok) setComplete(true);
  }

  if (complete) return <section className={styles.complete} aria-live="polite"><span aria-hidden="true">✓</span><h2>의견을 접수했습니다</h2><p>{message}</p><Link href="/dashboard">Dashboard로 돌아가기</Link></section>;

  return (
    <form className={styles.form} onSubmit={submit}>
      <label htmlFor="feedback-type">유형</label>
      <select id="feedback-type" name="type" defaultValue="UX">
        <option value="BUG">오류 신고</option>
        <option value="UX">사용성 의견</option>
        <option value="FEATURE_REQUEST">기능 제안</option>
        <option value="QUESTION">문의</option>
        <option value="OTHER">기타</option>
      </select>
      <label htmlFor="feedback-title">제목</label>
      <input id="feedback-title" name="title" minLength={2} maxLength={120} required />
      <label htmlFor="feedback-content">내용</label>
      <textarea id="feedback-content" name="content" minLength={10} maxLength={5000} required placeholder="불편했던 점이나 개선 의견을 자세히 알려주세요." />
      <p className={styles.notice}>비밀번호, 인증번호, 상세주소, 계약번호 등 민감한 개인정보는 입력하지 마세요.</p>
      {pageUrl ? <p className={styles.source}>접수 페이지: {pageUrl}</p> : null}
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
      <button disabled={pending}>{pending ? "접수 중…" : "의견 보내기"}</button>
    </form>
  );
}
