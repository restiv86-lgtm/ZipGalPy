"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "@/app/apartments/apartments.module.css";

export function JoinApartmentButton({ apartmentId }: { apartmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function join() {
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`/api/apartments/${apartmentId}/join`, { method: "POST" });
      const data = await response.json();
      if (response.status === 401) { router.push(`/login?next=/apartments/${apartmentId}`); return; }
      if (!response.ok) throw new Error(data.message);
      setMessage(data.message); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "참여하지 못했습니다."); }
    finally { setLoading(false); }
  }
  return <div className={styles.joinBox}><button className={styles.primaryButton} onClick={join} disabled={loading}>{loading ? "처리 중..." : "우리 아파트로 선택하기"}</button>{message && <p role="status">{message}</p>}<small>현재는 커뮤니티 참여 관계이며 주민 인증을 의미하지 않습니다.</small></div>;
}
