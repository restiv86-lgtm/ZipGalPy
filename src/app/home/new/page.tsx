import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeForm } from "@/components/home/home-form";
import { authOptions } from "@/lib/auth/options";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "내 집 등록 | 집갈피", robots: { index: false, follow: false } };

export default async function NewHomePage() {
  if (!(await getServerSession(authOptions))?.user) redirect("/login");
  return <main className={styles.page}><div className={styles.narrow}><Link className={styles.back} href="/dashboard">← Dashboard</Link><p className={styles.eyebrow}>ADD HOME</p><h1>내 집 등록</h1><p className={styles.lead}>생활 기록을 모을 첫 번째 공간을 등록해 주세요.</p><HomeForm /></div></main>;
}
