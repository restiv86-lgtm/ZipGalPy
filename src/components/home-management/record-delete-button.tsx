"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/homes/[homeId]/items/items.module.css";

export function RecordDeleteButton({ homeId, id, kind }: { homeId: string; id: string; kind: "repairs" | "schedules" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm("이 기록을 삭제할까요?")) return;
    setBusy(true);
    const response = await fetch(`/api/homes/${homeId}/${kind}/${id}`, { method: "DELETE" });
    if (response.ok) { router.push(`/homes/${homeId}/${kind}`); router.refresh(); return; }
    setBusy(false);
    window.alert("삭제하지 못했습니다.");
  }
  return <button className={styles.danger} type="button" disabled={busy} onClick={remove}>{busy ? "삭제 중" : "삭제"}</button>;
}
