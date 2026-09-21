import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ApartmentRequestForm } from "@/components/apartment/apartment-request-form";
import { authOptions } from "@/lib/auth/options";
import styles from "../apartments.module.css";

export const metadata: Metadata = { title: "아파트 추가 요청 | 집갈피", robots: { index: false, follow: false } };

export default async function ApartmentRequestPage() {
  if (!(await getServerSession(authOptions))?.user) redirect("/login?next=/apartments/request");
  return <main className={styles.page}><div className={styles.narrow}><Link className={styles.back} href="/apartments">← 아파트 검색</Link><p className={styles.eyebrow}>REQUEST APARTMENT</p><h1>찾는 아파트가 없나요?</h1><p className={styles.lead}>최소 정보만 알려주시면 공식 데이터를 확인한 뒤 추가하겠습니다. 입력한 정보로 아파트가 즉시 생성되지는 않습니다.</p><ApartmentRequestForm /></div></main>;
}
