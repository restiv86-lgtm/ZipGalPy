"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { FormattedCurrencyInput, FormattedDateInput } from "@/components/ui/formatted-inputs";
import { formatDateForInput, parseCurrencyValue } from "@/lib/forms/format";

type Contract = { id: string; type: string; title: string; companyName: string | null; contractNumber: string | null; startDate: Date | null; endDate: Date | null; amount: { toString(): string } | null; reminderDays: number[]; memo: string | null; status: string };
const types = { LEASE: "임대·전세", RENTAL: "렌탈", INSURANCE: "보험", INTERNET: "인터넷", SECURITY: "보안", MAINTENANCE: "유지관리", SUBSCRIPTION: "구독", OTHER: "기타" };

export function ContractForm({ homeId, contract }: { homeId: string; contract?: Contract }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), amount: parseCurrencyValue(String(form.get("amount") ?? "")), reminderDays: form.getAll("reminderDays").map(Number) };
    const response = await fetch(`/api/homes/${homeId}/contracts${contract ? `/${contract.id}` : ""}`, { method: contract ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.message); return; }
    router.push(`/homes/${homeId}/contracts`); router.refresh();
  }
  return <form className={styles.form} onSubmit={submit}>
    <label htmlFor="title">계약명 *</label><input id="title" name="title" defaultValue={contract?.title} required />
    <label htmlFor="type">계약 유형</label><select id="type" name="type" defaultValue={contract?.type ?? "OTHER"}>{Object.entries(types).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
    <div className={styles.two}><div><label htmlFor="startDate">시작일</label><FormattedDateInput id="startDate" name="startDate" aria-label="계약 시작일" defaultValue={formatDateForInput(contract?.startDate ?? null)} /></div><div><label htmlFor="endDate">종료일</label><FormattedDateInput id="endDate" name="endDate" aria-label="계약 종료일" defaultValue={formatDateForInput(contract?.endDate ?? null)} /></div></div>
    <div className={styles.two}><div><label htmlFor="companyName">업체명</label><input id="companyName" name="companyName" defaultValue={contract?.companyName ?? ""} /></div><div><label htmlFor="contractNumber">계약번호</label><input id="contractNumber" name="contractNumber" defaultValue={contract?.contractNumber ?? ""} /></div></div>
    <label htmlFor="amount">계약금액</label><FormattedCurrencyInput id="amount" name="amount" aria-label="계약금액" defaultValue={contract?.amount?.toString() ?? ""} />
    <fieldset style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 12, border: "1px solid #cbded9", borderRadius: 12, padding: 16 }}><legend style={{ padding: "0 6px", fontWeight: 750 }}>Dashboard 알림 시점</legend>{[90, 60, 30, 7].map((day) => <label key={day} style={{ display: "flex", alignItems: "center", gap: 9, margin: 0 }}><input type="checkbox" name="reminderDays" value={day} defaultChecked={contract?.reminderDays.includes(day) ?? false} style={{ width: 18, height: 18, margin: 0, padding: 0, flex: "0 0 auto", accentColor: "#087f72" }} /><span>{day}일 전</span></label>)}</fieldset>
    <label htmlFor="status">계약 상태</label><select id="status" name="status" defaultValue={contract?.status ?? "ACTIVE"}><option value="ACTIVE">사용 중</option><option value="TERMINATED">종료 처리</option></select>
    <label htmlFor="memo">개인 메모</label><textarea id="memo" name="memo" defaultValue={contract?.memo ?? ""} />
    <p className={styles.meta}>계약번호, 금액, 기간, 업체와 메모는 외부에 공개되지 않습니다.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary}>{contract ? "수정 완료" : "계약 등록"}</button>
  </form>;
}
