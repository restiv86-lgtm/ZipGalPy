"use client";

import { FormEvent, useState } from "react";
import styles from "@/app/apartments/apartments.module.css";

export function ApartmentRequestForm() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/apartment-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setDone(true); setMessage(data.message);
    } catch (error) { setMessage(error instanceof Error ? error.message : "요청을 접수하지 못했습니다."); }
    finally { setLoading(false); }
  }
  if (done) return <div className={styles.success}><span aria-hidden="true">✓</span><h2>요청이 접수되었습니다.</h2><p>{message}</p></div>;
  return <form className={styles.requestForm} onSubmit={submit}>
    <label>시도<input name="sido" required maxLength={30} placeholder="예: 서울특별시" /></label>
    <label>시군구<input name="sigungu" maxLength={50} placeholder="예: 노원구" /></label>
    <label>읍면동<input name="eupmyeondong" maxLength={60} placeholder="예: 상계동" /></label>
    <label>아파트/단지명<input name="apartmentName" required minLength={2} maxLength={120} /></label>
    <label>주소 <small>(알고 있는 경우)</small><input name="address" maxLength={240} /></label>
    {message && <p className={styles.alert} role="alert">{message}</p>}
    <button className={styles.primaryButton} disabled={loading}>{loading ? "접수 중..." : "추가 요청하기"}</button>
  </form>;
}
