"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import styles from "@/app/apartments/apartments.module.css";

type Apartment = { id: string; name: string; sido: string; sigungu: string; eupmyeondong: string | null; roadAddress: string };
type Region = Pick<Apartment, "sido" | "sigungu" | "eupmyeondong">;

export function ApartmentSearch() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [filters, setFilters] = useState({ q: "", sido: "", sigungu: "", eupmyeondong: "" });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/apartments/regions").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => setRegions(data.regions)).catch(() => setMessage("지역 정보를 불러오지 못했습니다."));
  }, []);

  const sidos = useMemo(() => [...new Set(regions.map((row) => row.sido))], [regions]);
  const sigungus = useMemo(() => [...new Set(regions.filter((row) => row.sido === filters.sido).map((row) => row.sigungu))], [regions, filters.sido]);
  const eupmyeondongs = useMemo(() => [...new Set(regions.filter((row) => row.sido === filters.sido && row.sigungu === filters.sigungu).map((row) => row.eupmyeondong).filter((value): value is string => Boolean(value)))], [regions, filters.sido, filters.sigungu]);

  async function search(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setMessage("");
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    try {
      const response = await fetch(`/api/apartments?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setApartments(data.apartments); setSearched(true);
    } catch { setMessage("검색 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."); }
    finally { setLoading(false); }
  }

  return <>
    <form className={styles.searchPanel} onSubmit={search}>
      <div className={styles.nameSearch}><label htmlFor="apartment-query">아파트명 또는 주소</label><input id="apartment-query" value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="예: 상계주공" /></div>
      <div className={styles.regionGrid}>
        <label>시도<select value={filters.sido} onChange={(event) => setFilters({ ...filters, sido: event.target.value, sigungu: "", eupmyeondong: "" })}><option value="">전체 시도</option>{sidos.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>시군구<select value={filters.sigungu} disabled={!filters.sido} onChange={(event) => setFilters({ ...filters, sigungu: event.target.value, eupmyeondong: "" })}><option value="">전체 시군구</option>{sigungus.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>읍면동<select value={filters.eupmyeondong} disabled={!filters.sigungu} onChange={(event) => setFilters({ ...filters, eupmyeondong: event.target.value })}><option value="">전체 읍면동</option>{eupmyeondongs.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <button className={styles.primaryButton} disabled={loading}>{loading ? "검색 중..." : "아파트 찾기"}</button>
    </form>
    {message && <p className={styles.alert} role="alert">{message}</p>}
    {searched && <section className={styles.results} aria-live="polite"><h2>검색 결과 <small>{apartments.length}개</small></h2>{apartments.length ? <div className={styles.resultList}>{apartments.map((apartment) => <Link href={`/apartments/${apartment.id}`} key={apartment.id}><strong>{apartment.name}</strong><span>{[apartment.sido, apartment.sigungu, apartment.eupmyeondong].filter(Boolean).join(" ")}</span><p>{apartment.roadAddress}</p><b>상세 보기 →</b></Link>)}</div> : <div className={styles.empty}><span aria-hidden="true">🏢</span><h3>검색 결과가 없습니다.</h3><p>공식 데이터에 없는 단지는 관리자 확인을 거쳐 추가할 수 있습니다.</p><Link className={styles.secondaryButton} href="/apartments/request">아파트 추가 요청</Link></div>}</section>}
  </>;
}
