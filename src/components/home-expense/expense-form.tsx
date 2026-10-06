"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { FormattedCurrencyInput, FormattedDateInput } from "@/components/ui/formatted-inputs";
import { formatDateForInput, parseCurrencyValue } from "@/lib/forms/format";

type Expense = { id: string; homeItemId: string | null; repairId: string | null; category: string; title: string; amount: { toString(): string }; expenseDate: Date; paymentMethod: string | null; memo: string | null };
type HomeOption = { id: string; name: string; items: { id: string; name: string }[]; repairs: { id: string; title: string; homeItemId: string | null }[] };
const labels = { PURCHASE: "구매", REPAIR: "수리", MAINTENANCE: "유지관리", MANAGEMENT: "관리비", UTILITY: "공과금", CONTRACT: "계약관련", INSURANCE: "보험", TAX: "세금", OTHER: "기타" };

export function ExpenseForm({ homeId, homes, expense }: { homeId: string; homes: HomeOption[]; expense?: Expense }) {
  const router = useRouter();
  const [selectedHomeId, setSelectedHomeId] = useState(expense ? homeId : homes.length === 1 ? homes[0].id : "");
  const [homeItemId, setHomeItemId] = useState(expense?.homeItemId ?? "");
  const [repairId, setRepairId] = useState(expense?.repairId ?? "");
  const [error, setError] = useState("");
  const home = homes.find((candidate) => candidate.id === selectedHomeId);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedHomeId) { setError("비용을 등록할 집을 선택해 주세요."); return; }
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), targetHomeId: selectedHomeId, homeItemId, repairId, amount: parseCurrencyValue(String(form.get("amount") ?? "")) };
    const requestHomeId = expense ? homeId : selectedHomeId;
    const response = await fetch(`/api/homes/${requestHomeId}/expenses${expense ? `/${expense.id}` : ""}`, { method: expense ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json(); if (!response.ok) { setError(data.message); return; }
    router.push(`/homes/${data.expense.homeId ?? selectedHomeId}/expenses/${expense?.id ?? data.expense.id}`); router.refresh();
  }
  return <form className={styles.form} onSubmit={submit}>
    <label htmlFor="targetHomeId">어느 집의 비용인가요? *</label><select id="targetHomeId" value={selectedHomeId} onChange={(event) => { setSelectedHomeId(event.target.value); setHomeItemId(""); setRepairId(""); }} required><option value="">집을 선택해 주세요</option>{homes.map((candidate) => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select>
    <label htmlFor="title">비용명 *</label><input id="title" name="title" defaultValue={expense?.title} maxLength={120} required />
    <div className={styles.two}><div><label htmlFor="category">카테고리 *</label><select id="category" name="category" defaultValue={expense?.category ?? "OTHER"}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div><label htmlFor="amount">금액 *</label><FormattedCurrencyInput id="amount" name="amount" aria-label="비용 금액" defaultValue={expense?.amount.toString() ?? ""} required /></div></div>
    <label htmlFor="expenseDate">날짜 *</label><FormattedDateInput id="expenseDate" name="expenseDate" aria-label="비용 날짜" defaultValue={formatDateForInput(expense?.expenseDate ?? new Date())} required />
    <label htmlFor="homeItemId">관련 물건</label><select id="homeItemId" name="homeItemId" value={homeItemId} onChange={(event) => setHomeItemId(event.target.value)}><option value="">연결하지 않음</option>{home?.items.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
    <label htmlFor="repairId">관련 수리·점검</label><select id="repairId" name="repairId" value={repairId} onChange={(event) => setRepairId(event.target.value)}><option value="">연결하지 않음</option>{home?.repairs.map((repair) => <option value={repair.id} key={repair.id}>{repair.title}</option>)}</select>
    <label htmlFor="paymentMethod">결제수단</label><input id="paymentMethod" name="paymentMethod" defaultValue={expense?.paymentMethod ?? ""} maxLength={80} />
    <label htmlFor="memo">개인 메모</label><textarea id="memo" name="memo" defaultValue={expense?.memo ?? ""} maxLength={2000} />
    <p className={styles.meta}>금액, 결제수단, 메모는 커뮤니티나 장터에 공개되지 않습니다.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary}>{expense ? "수정 완료" : "비용 등록"}</button>
  </form>;
}
