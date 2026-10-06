"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { FormattedCurrencyInput, FormattedDateInput } from "@/components/ui/formatted-inputs";
import { formatDateForInput, parseCurrencyValue } from "@/lib/forms/format";

type Repair = { id: string; homeItemId: string | null; type: string; title: string; description: string; repairDate: Date; cost: { toString(): string } | null; companyName: string | null; nextCheckDate: Date | null; memo: string | null };
type HomeOption = { id: string; name: string; items: { id: string; name: string }[] };
const labels = { REPAIR: "수리", INSPECTION: "점검", CLEANING: "청소", REPLACEMENT: "교체", OTHER: "기타" };

export function RepairForm({ homeId, homes, repair }: { homeId: string; homes: HomeOption[]; repair?: Repair }) {
  const router = useRouter();
  const [selectedHomeId, setSelectedHomeId] = useState(repair ? homeId : homes.length === 1 ? homes[0].id : "");
  const [homeItemId, setHomeItemId] = useState(repair?.homeItemId ?? "");
  const [error, setError] = useState("");
  const items = homes.find((home) => home.id === selectedHomeId)?.items ?? [];
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHomeId) { setError("수리·점검 기록을 등록할 집을 선택해 주세요."); return; }
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), targetHomeId: selectedHomeId, homeItemId, cost: parseCurrencyValue(String(form.get("cost") ?? "")), createSchedule: form.get("createSchedule") === "on", createExpense: form.get("createExpense") === "on" };
    const requestHomeId = repair ? homeId : selectedHomeId;
    const response = await fetch(`/api/homes/${requestHomeId}/repairs${repair ? `/${repair.id}` : ""}`, { method: repair ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.message); return; }
    router.push(`/homes/${data.repair.homeId ?? selectedHomeId}/repairs/${repair?.id ?? data.repair.id}`); router.refresh();
  }
  return <form className={styles.form} onSubmit={submit}>
    <label htmlFor="targetHomeId">어느 집의 수리·점검인가요? *</label><select id="targetHomeId" value={selectedHomeId} onChange={(event) => { setSelectedHomeId(event.target.value); setHomeItemId(""); }} required><option value="">집을 선택해 주세요</option>{homes.map((home) => <option value={home.id} key={home.id}>{home.name}</option>)}</select>
    <label htmlFor="homeItemId">연결 물건</label><select id="homeItemId" name="homeItemId" value={homeItemId} onChange={(event) => setHomeItemId(event.target.value)}><option value="">집 전체</option>{items.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
    <div className={styles.two}><div><label htmlFor="type">유형</label><select id="type" name="type" defaultValue={repair?.type ?? "REPAIR"}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div><label htmlFor="repairDate">수리·점검일</label><FormattedDateInput id="repairDate" name="repairDate" aria-label="수리·점검일" defaultValue={formatDateForInput(repair?.repairDate ?? new Date())} required /></div></div>
    <label htmlFor="title">제목</label><input id="title" name="title" defaultValue={repair?.title} required />
    <label htmlFor="description">내용</label><textarea id="description" name="description" defaultValue={repair?.description} required />
    <div className={styles.two}><div><label htmlFor="cost">비용</label><FormattedCurrencyInput id="cost" name="cost" aria-label="수리·점검 비용" defaultValue={repair?.cost?.toString() ?? ""} /></div><div><label htmlFor="companyName">업체명</label><input id="companyName" name="companyName" defaultValue={repair?.companyName ?? ""} /></div></div>
    {!repair && <label style={{ display: "flex", alignItems: "center", gap: 9 }}><input name="createExpense" type="checkbox" style={{ width: 18, height: 18, margin: 0, padding: 0, flex: "0 0 auto", accentColor: "#087f72" }} /><span>비용관리에도 기록</span></label>}
    <label htmlFor="nextCheckDate">다음 점검일</label><FormattedDateInput id="nextCheckDate" name="nextCheckDate" aria-label="다음 점검일" defaultValue={formatDateForInput(repair?.nextCheckDate ?? null)} />
    {!repair && <label style={{ display: "flex", alignItems: "center", gap: 9 }}><input name="createSchedule" type="checkbox" style={{ width: 18, height: 18, margin: 0, padding: 0, flex: "0 0 auto", accentColor: "#087f72" }} /><span>다음 점검일을 일정에 함께 등록</span></label>}
    <label htmlFor="memo">개인 메모</label><textarea id="memo" name="memo" defaultValue={repair?.memo ?? ""} />
    <p className={styles.meta}>수리비, 업체명, 메모는 커뮤니티에 자동 공개되지 않습니다.</p>{error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary}>{repair ? "수정 완료" : "기록 등록"}</button>
  </form>;
}
