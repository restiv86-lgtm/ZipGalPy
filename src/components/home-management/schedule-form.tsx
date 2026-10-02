"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { FormattedDateTimeInput } from "@/components/ui/formatted-inputs";
import { formatDateTimeForInput } from "@/lib/forms/format";

type Schedule = { id: string; homeItemId: string | null; repairId: string | null; title: string; scheduledAt: Date; type: string; completed: boolean; memo: string | null };
const types = { INSPECTION: "점검", WARRANTY: "보증", REPAIR: "수리", CONTRACT: "계약", PAYMENT: "납부", OTHER: "기타" };

export function ScheduleForm({ homeId, items, schedule }: { homeId: string; items: { id: string; name: string }[]; schedule?: Schedule }) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form);
    Object.assign(body, { completed: form.get("completed") === "on", repairId: schedule?.repairId ?? "" });
    const response = await fetch(`/api/homes/${homeId}/schedules${schedule ? `/${schedule.id}` : ""}`, { method: schedule ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.message); return; }
    router.push(`/homes/${homeId}/schedules`); router.refresh();
  }
  return <form className={styles.form} onSubmit={submit}>
    <label htmlFor="homeItemId">연결 물건</label><select id="homeItemId" name="homeItemId" defaultValue={schedule?.homeItemId ?? ""}><option value="">집 전체</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <div className={styles.two}><div><label htmlFor="type">유형</label><select id="type" name="type" defaultValue={schedule?.type ?? "INSPECTION"}>{Object.entries(types).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div><label htmlFor="scheduledAt">일정 일시</label><FormattedDateTimeInput id="scheduledAt" name="scheduledAt" aria-label="일정 날짜" defaultValue={formatDateTimeForInput(schedule?.scheduledAt ?? new Date())} required /></div></div>
    <label htmlFor="title">제목</label><input id="title" name="title" defaultValue={schedule?.title} required />
    <label htmlFor="memo">메모</label><textarea id="memo" name="memo" defaultValue={schedule?.memo ?? ""} />
    <div style={{ display: "grid", gap: 5, marginTop: 9 }}><label style={{ display: "flex", alignItems: "center", gap: 9, margin: 0 }}><input name="completed" type="checkbox" defaultChecked={schedule?.completed} style={{ width: 18, height: 18, margin: 0, padding: 0, flex: "0 0 auto", accentColor: "#087f72" }} /><span>일정 완료</span></label><p className={styles.meta} style={{ margin: "0 0 0 27px", lineHeight: 1.55 }}>이미 처리한 일정을 기록할 때만 체크하세요. 완료된 일정은 예정 일정과 Dashboard 알림에서 제외됩니다.</p></div>
    {error && <p className={styles.error} role="alert">{error}</p>}<button className={styles.primary}>{schedule ? "수정 완료" : "일정 등록"}</button>
  </form>;
}
