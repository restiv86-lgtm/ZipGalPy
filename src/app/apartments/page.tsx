import type { Metadata } from "next";
import Link from "next/link";
import { ApartmentSearch } from "@/components/apartment/apartment-search";
import { Logo } from "@/components/marketing/logo";
import { apartmentDataAttribution } from "@/data/apartment-source";
import styles from "./apartments.module.css";

export const metadata: Metadata = { title: "우리 아파트 찾기 | 집갈피", description: "지역이나 단지명으로 우리 아파트를 찾고 집갈피 커뮤니티에 참여하세요." };

export default function ApartmentsPage() {
  return <main className={styles.page}><header className={styles.header}><div className={styles.container}><Logo href="/" /><nav><Link href="/dashboard">Dashboard</Link><Link href="/">홈페이지</Link></nav></div></header><div className={`${styles.container} ${styles.content}`}><section className={styles.hero}><p className={styles.eyebrow}>OUR APARTMENT</p><h1>우리 아파트를 찾아보세요</h1><p>지역을 차례로 선택하거나 아파트 이름을 직접 검색할 수 있습니다.<br />동·호수나 상세 거주정보는 수집하지 않습니다.</p></section><ApartmentSearch /><aside className={styles.source}><strong>데이터 출처</strong><p>{apartmentDataAttribution.label}</p><a href={apartmentDataAttribution.href} target="_blank" rel="noreferrer">공공데이터 상세 보기 ↗</a><small>{apartmentDataAttribution.license}</small></aside></div></main>;
}
