import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardLogoutButton } from "@/components/dashboard/dashboard-logout-button";
import { Logo } from "@/components/marketing/logo";
import { listUserApartmentMemberships } from "@/lib/apartment/service";
import { authOptions } from "@/lib/auth/options";
import { listHomes } from "@/lib/home/service";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard | 집갈피", robots: { index: false, follow: false } };

const housingLabels: Record<string, string> = { APARTMENT: "아파트", VILLA: "빌라", DETACHED_HOUSE: "단독주택", OFFICETEL: "오피스텔", OTHER: "기타" };
const menu = [
  ["📦", "우리집 물건", "items"], ["📅", "일정", "schedule"], ["🔧", "수리/점검", "repairs"],
  ["📄", "문서", "documents"], ["💰", "비용", "expenses"], ["🤖", "AI 집 관리", "ai"],
] as const;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const [homes, apartmentMemberships] = await Promise.all([listHomes(session.user.id), listUserApartmentMemberships(session.user.id)]);
  return (
    <main className={styles.page}>
      <header className={styles.header}><div className={styles.container}><Logo href="/" /><nav><Link href="/">홈페이지</Link><DashboardLogoutButton /></nav></div></header>
      <div className={`${styles.container} ${styles.content}`}>
        <section className={styles.welcome}><p className={styles.eyebrow}>MY ZIPGALPY</p><h1>안녕하세요, {session.user.name ?? "회원"}님</h1><p>내 집의 정보와 생활 기록을 한곳에서 관리하세요.</p></section>
        <section aria-labelledby="homes-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MY HOMES</p><h2 id="homes-title">내 집</h2></div><Link className={styles.primaryLink} href="/home/new">+ 내 집 등록</Link></div>
          {homes.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🏡</span><h3>첫 번째 집을 등록해보세요</h3><p>주소와 기본 정보를 등록하면 집갈피 생활 관리가 시작됩니다.</p><Link className={styles.primaryLink} href="/home/new">내 집 등록하기</Link></div> : <div className={styles.homeGrid}>{homes.map((home) => <article className={styles.homeCard} key={home.id}><div><span>{housingLabels[home.housingType]}</span><h3>{home.name}</h3><p>{home.address}{home.addressDetail ? ` ${home.addressDetail}` : ""}</p></div><dl><div><dt>면적</dt><dd>{home.area ? `${home.area}㎡` : "미입력"}</dd></div><div><dt>준공</dt><dd>{home.builtYear ? `${home.builtYear}년` : "미입력"}</dd></div></dl><Link href={`/home/${home.id}/edit`}>집 정보 수정 →</Link></article>)}</div>}
        </section>
        <section aria-labelledby="apartment-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>OUR APARTMENT</p><h2 id="apartment-title">우리 아파트</h2></div><Link className={styles.primaryLink} href="/apartments">아파트 찾기</Link></div>{apartmentMemberships.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🏢</span><h3>우리 아파트를 찾아보세요</h3><p>공식 공동주택 정보를 검색하고 커뮤니티 참여 기반을 준비하세요.</p><Link className={styles.primaryLink} href="/apartments">찾아보기</Link></div> : <div className={styles.homeGrid}>{apartmentMemberships.map(({ apartment }) => <article className={styles.homeCard} key={apartment.id}><div><span>커뮤니티 참여 중</span><h3>{apartment.name}</h3><p>{apartment.sido} {apartment.sigungu}</p></div><Link href={`/apartments/${apartment.id}`}>상세 보기 →</Link></article>)}</div>}</section>
        <section aria-labelledby="status-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>HOME STATUS</p><h2 id="status-title">우리 집 관리 현황</h2></div></div><div className={styles.statusGrid}>{[["등록된 물건","0개"],["예정 일정","0개"],["보관 문서","0개"],["수리 기록","0개"]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>
        <section aria-labelledby="menu-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SERVICES</p><h2 id="menu-title">집 관리 메뉴</h2></div></div><div className={styles.menuGrid}><Link href={homes[0] ? `/home/${homes[0].id}/edit` : "/home/new"}><span>🏠</span><strong>집 정보</strong><small>기본 정보와 주소 관리</small></Link>{menu.map(([icon,label,path])=><Link href={`/dashboard/${path}`} key={path}><span>{icon}</span><strong>{label}</strong><small>기능 준비 중</small></Link>)}</div></section>
      </div>
    </main>
  );
}
