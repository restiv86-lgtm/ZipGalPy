import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/marketing/logo";
import { authOptions } from "@/lib/auth/options";
import styles from "./onboarding.module.css";

export const metadata: Metadata = { title: "시작하기 | 집갈피", robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?next=/onboarding");
  return <main className={styles.page}><section className={styles.panel}><Logo href="/" className={styles.logo} /><p className={styles.eyebrow}>WELCOME TO ZIPGALPY</p><h1>집갈피에 오신 것을 환영합니다.</h1><p className={styles.lead}>어떻게 시작할까요?</p><div className={styles.cards}><Link href="/home/new"><span>🏠</span><strong>내 집 등록하기</strong><small>우리 집 기본정보부터 기록해요</small><b>시작하기 →</b></Link><Link href="/apartments"><span>🏢</span><strong>우리 아파트 찾기</strong><small>공식 단지 정보에서 우리 아파트를 찾아요</small><b>찾아보기 →</b></Link><Link href="/dashboard"><span>🌿</span><strong>나중에 하기</strong><small>먼저 Dashboard를 둘러볼게요</small><b>Dashboard →</b></Link></div></section></main>;
}
