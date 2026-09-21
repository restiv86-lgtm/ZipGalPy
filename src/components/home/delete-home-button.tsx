"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/dashboard/dashboard.module.css";

export function DeleteHomeButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function remove() {
    if (!window.confirm("이 집 정보를 삭제할까요? 삭제 후 복구할 수 없습니다.")) return;
    setPending(true);
    const response = await fetch(`/api/homes/${id}`, { method: "DELETE" });
    if (response.ok) { router.push("/dashboard"); router.refresh(); return; }
    setPending(false); window.alert("집 정보를 삭제하지 못했습니다.");
  }
  return <button className={styles.dangerButton} type="button" onClick={remove} disabled={pending}>{pending ? "삭제 중…" : "집 삭제"}</button>;
}
