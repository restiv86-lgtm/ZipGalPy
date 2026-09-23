"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export function DocumentDeleteButton({ homeId, documentId }: { homeId: string; documentId: string }) { const router = useRouter(), [busy, setBusy] = useState(false); async function remove() { if (!confirm("이 문서 정보를 삭제할까요?")) return; setBusy(true); const response = await fetch(`/api/homes/${homeId}/documents/${documentId}`, { method: "DELETE" }); if (response.ok) { router.push(`/homes/${homeId}/documents`); router.refresh(); return; } setBusy(false); alert("삭제하지 못했습니다."); } return <button className={styles.danger} disabled={busy} onClick={remove}>{busy ? "삭제 중" : "삭제"}</button>; }
