import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinApartmentButton } from "@/components/apartment/join-apartment-button";
import { apartmentDataAttribution } from "@/data/apartment-source";
import { getApartment } from "@/lib/apartment/service";
import styles from "../apartments.module.css";

export const metadata: Metadata = { title: "아파트 상세 | 집갈피", robots: { index: false, follow: false } };

export default async function ApartmentDetailPage({ params }: PageProps<"/apartments/[id]">) {
  const { id } = await params;
  const apartment = await getApartment(id);
  if (!apartment) notFound();
  return <main className={styles.page}><div className={styles.narrow}><Link className={styles.back} href="/apartments">← 아파트 검색</Link><article className={styles.detail}><span className={styles.badge}>공동주택 기본정보</span><h1>{apartment.name}</h1><dl><div><dt>지역</dt><dd>{[apartment.sido, apartment.sigungu, apartment.eupmyeondong].filter(Boolean).join(" ")}</dd></div><div><dt>도로명주소</dt><dd>{apartment.roadAddress}</dd></div>{apartment.jibunAddress && <div><dt>법정동주소</dt><dd>{apartment.jibunAddress}</dd></div>}</dl><JoinApartmentButton apartmentId={apartment.id} /><p className={styles.detailSource}>출처: <a href={apartmentDataAttribution.href} target="_blank" rel="noreferrer">{apartmentDataAttribution.label}</a></p></article></div></main>;
}
