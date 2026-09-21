"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressField } from "./address-field";
import styles from "@/app/dashboard/dashboard.module.css";

type HomeValues = {
  id?: string;
  name?: string;
  address?: string;
  addressDetail?: string | null;
  housingType?: string;
  area?: number | null;
  builtYear?: number | null;
  memo?: string | null;
};

type Errors = Partial<Record<"name" | "address" | "addressDetail" | "housingType" | "area" | "builtYear" | "memo", string[]>>;

export function HomeForm({ initialHome = {} }: { initialHome?: HomeValues }) {
  const router = useRouter();
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setErrors({}); setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = Object.fromEntries(["name", "address", "addressDetail", "housingType", "area", "builtYear", "memo"].map((key) => [key, data.get(key)]));
    try {
      const response = await fetch(initialHome.id ? `/api/homes/${initialHome.id}` : "/api/homes", {
        method: initialHome.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors ?? {}); setMessage(result.message ?? "저장하지 못했습니다."); return; }
      router.push("/dashboard"); router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally { setPending(false); }
  }

  const error = (key: keyof Errors) => errors[key]?.[0];
  return (
    <form className={styles.homeForm} onSubmit={submit} noValidate>
      <label htmlFor="home-name">집 이름</label>
      <input id="home-name" name="name" defaultValue={initialHome.name} placeholder="예: 우리집" maxLength={40} required />
      {error("name") && <p className={styles.error}>{error("name")}</p>}
      <AddressField defaultValue={initialHome.address} error={error("address")} />
      <label htmlFor="address-detail">상세주소</label>
      <input id="address-detail" name="addressDetail" defaultValue={initialHome.addressDetail ?? ""} maxLength={100} />
      {error("addressDetail") && <p className={styles.error}>{error("addressDetail")}</p>}
      <label htmlFor="housing-type">주거형태</label>
      <select id="housing-type" name="housingType" defaultValue={initialHome.housingType ?? ""} required>
        <option value="" disabled>선택해 주세요</option><option value="APARTMENT">아파트</option><option value="VILLA">빌라</option><option value="DETACHED_HOUSE">단독주택</option><option value="OFFICETEL">오피스텔</option><option value="OTHER">기타</option>
      </select>
      {error("housingType") && <p className={styles.error}>{error("housingType")}</p>}
      <div className={styles.twoColumns}>
        <div><label htmlFor="area">면적 (㎡)</label><input id="area" name="area" type="number" min="0.01" max="100000" step="0.01" defaultValue={initialHome.area ?? ""} /></div>
        <div><label htmlFor="built-year">준공년도</label><input id="built-year" name="builtYear" type="number" min="1800" max={new Date().getFullYear() + 1} defaultValue={initialHome.builtYear ?? ""} /></div>
      </div>
      {(error("area") || error("builtYear")) && <p className={styles.error}>{error("area") ?? error("builtYear")}</p>}
      <label htmlFor="memo">메모</label>
      <textarea id="memo" name="memo" defaultValue={initialHome.memo ?? ""} maxLength={1000} rows={5} />
      {error("memo") && <p className={styles.error}>{error("memo")}</p>}
      {message && <p className={styles.alert} role="alert">{message}</p>}
      <button className={styles.primaryButton} type="submit" disabled={pending}>{pending ? "저장 중…" : initialHome.id ? "변경사항 저장" : "내 집 등록"}</button>
    </form>
  );
}
