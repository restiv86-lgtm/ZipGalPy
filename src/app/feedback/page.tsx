import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { authOptions } from "@/lib/auth/options";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "의견 보내기 | 집갈피", robots: { index: false, follow: false } };

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?next=/feedback");
  const { from } = await searchParams;
  const pageUrl = typeof from === "string" && from.startsWith("/") && !from.startsWith("//") ? from.slice(0, 500) : null;
  return <main className={styles.page}><div className={styles.narrow}><Link className={styles.back} href="/dashboard">← Dashboard</Link><p className={styles.eyebrow}>BETA FEEDBACK</p><h1>의견 보내기</h1><p className={styles.lead}>집갈피를 사용하며 발견한 오류나 불편한 점, 필요한 기능을 알려주세요.</p><FeedbackForm pageUrl={pageUrl} /></div></main>;
}
