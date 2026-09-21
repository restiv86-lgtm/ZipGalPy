import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import styles from "../dashboard.module.css";

const features: Record<string, string> = { items: "우리집 물건", schedule: "일정", repairs: "수리/점검", documents: "문서", expenses: "비용", ai: "AI 집 관리" };

export default async function FeaturePage({ params }: { params: Promise<{ feature: string }> }) {
  if (!(await getServerSession(authOptions))?.user) redirect("/login");
  const feature = (await params).feature;
  if (!features[feature]) notFound();
  return <main className={styles.page}><div className={styles.placeholder}><Link className={styles.back} href="/dashboard">← Dashboard</Link><span aria-hidden="true">🌿</span><h1>{features[feature]}</h1><p>다음 개발 단계에서 실제 데이터와 연결할 예정입니다.</p></div></main>;
}
