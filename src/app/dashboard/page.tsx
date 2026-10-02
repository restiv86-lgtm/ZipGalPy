import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserApartmentMemberships } from "@/lib/apartment/service";
import { authOptions } from "@/lib/auth/options";
import { homeFeatureHref } from "@/lib/home/navigation";
import { listHomes } from "@/lib/home/service";
import { dashboardManagement } from "@/lib/home-management/service";
import { expenseTotals } from "@/lib/home-expense/service";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard | 집갈피", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const homes = await listHomes(session.user.id);
  const singleHomeId = homes.length === 1 ? homes[0].id : null;
  const [apartmentMemberships, management, expenses] = await Promise.all([
    listUserApartmentMemberships(session.user.id),
    dashboardManagement(session.user.id),
    expenseTotals(session.user.id),
  ]);

  return <main className={styles.page}><div className={`${styles.container} ${styles.content}`}>
    <section className={styles.welcome}><p className={styles.eyebrow}>MY ZIPGALPY</p><h1>안녕하세요, {session.user.name ?? "회원"}님</h1><p>등록한 모든 집의 정보와 생활 기록을 한곳에서 관리하세요.</p><Link className={`${styles.primaryLink} ${styles.feedbackLink}`} href="/feedback?from=/dashboard">의견 보내기</Link></section>

    <section aria-labelledby="homes-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>PRIVATE HOME</p><h2 id="homes-title">내 주거공간 관리</h2><p className={styles.selectedHome}>특정 집을 먼저 고르지 않고 필요한 관리 기능에서 집을 선택할 수 있습니다.</p></div><Link className={styles.primaryLink} href="/home/new">+ 주거공간 등록</Link></div>
      {homes.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🏡</span><h3>첫 번째 집을 등록해보세요</h3><p>주소와 기본 정보를 등록하면 집갈피 생활 관리가 시작됩니다.</p><Link className={styles.primaryLink} href="/home/new">내 집 등록하기</Link></div> : <div className={styles.homeOverview}><span aria-hidden="true">🏠</span><div><strong>등록된 주거공간 {homes.length}곳</strong><p>물건은 전체 목록에서 함께 보고, 수리·일정·비용·계약·문서는 해당 기능에서 집을 선택해 관리합니다.</p></div></div>}
    </section>

    <section aria-labelledby="menu-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>SERVICES</p><h2 id="menu-title">집 관리 메뉴</h2><p className={styles.selectedHome}>등록한 모든 집의 생활 기록을 관리합니다.</p></div></div><div className={styles.menuGrid}>
      <Link href="/items"><span>📦</span><strong>우리집 물건</strong><small>모든 집의 물건과 보증 정보</small></Link>
      <Link href={homeFeatureHref("schedule", singleHomeId)}><span>📅</span><strong>일정</strong><small>점검과 생활 일정 관리</small></Link>
      <Link href={homeFeatureHref("repairs", singleHomeId)}><span>🔧</span><strong>수리/점검</strong><small>수리와 점검 이력 관리</small></Link>
      <Link href={homeFeatureHref("expenses", singleHomeId)}><span>💰</span><strong>비용</strong><small>집 관련 지출 관리</small></Link>
      <Link href={homeFeatureHref("contracts", singleHomeId)}><span>📝</span><strong>계약</strong><small>계약과 만료일 관리</small></Link>
      <Link href={homeFeatureHref("documents", singleHomeId)}><span>📄</span><strong>문서</strong><small>문서 정보와 만료일 관리</small></Link>
      <Link href="/dashboard/ai"><span>🤖</span><strong>AI 집 관리</strong><small>기능 준비 중</small></Link>
    </div></section>

    {management.upcoming.length > 0 && <section aria-labelledby="upcoming-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>UPCOMING</p><h2 id="upcoming-title">다가오는 일정</h2><p className={styles.selectedHome}>등록한 모든 집의 일정을 날짜순으로 보여드립니다.</p></div></div><div className={styles.homeGrid}>{management.upcoming.map((schedule) => { const day = new Date(schedule.scheduledAt); const today = day.toDateString() === management.now.toDateString(); const overdue = day < management.now && !today; return <article className={styles.homeCard} key={schedule.id}><div><span>{overdue ? "지난 미완료 일정" : today ? "오늘 일정" : "7일 이내 일정"}</span><h3>{schedule.title}</h3><p>{schedule.home.name} · {day.toLocaleString("ko-KR")}</p></div><Link href={`/homes/${schedule.homeId}/schedules/${schedule.id}/edit`}>일정 확인 →</Link></article>; })}</div></section>}

    <section aria-labelledby="expense-summary-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>HOME EXPENSES</p><h2 id="expense-summary-title">전체 집 관련 지출</h2><p className={styles.selectedHome}>등록한 모든 집의 비용을 합산한 금액입니다.</p></div></div><div className={styles.statusGrid}>
      <Link className={styles.statusCard} aria-label={`이번 달 전체 집 관련 지출 ${expenses.month.toLocaleString("ko-KR")}원 보기`} href={singleHomeId ? `/homes/${singleHomeId}/expenses?period=month` : "/dashboard/expenses"}><span>이번 달</span><strong>{expenses.month.toLocaleString("ko-KR")}원</strong><small>비용 관리 →</small></Link>
      <Link className={styles.statusCard} aria-label={`올해 전체 집 관련 지출 ${expenses.year.toLocaleString("ko-KR")}원 보기`} href={singleHomeId ? `/homes/${singleHomeId}/expenses?period=year` : "/dashboard/expenses"}><span>올해</span><strong>{expenses.year.toLocaleString("ko-KR")}원</strong><small>비용 관리 →</small></Link>
    </div></section>

    <section aria-labelledby="apartment-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>APARTMENT COMMUNITY</p><h2 id="apartment-title">아파트 커뮤니티</h2><p className={styles.selectedHome}>게시판과 장터를 이용할 아파트를 선택하는 공간입니다.</p></div><Link className={styles.primaryLink} href="/apartments">커뮤니티 찾기</Link></div>{apartmentMemberships.length === 0 ? <div className={styles.empty}><span aria-hidden="true">🏢</span><h3>참여할 아파트 커뮤니티를 찾아보세요</h3><p>개인 주거정보와 분리된 아파트 게시판·장터에 참여할 수 있습니다.</p><Link className={styles.primaryLink} href="/apartments">아파트 검색하기</Link></div> : <div className={styles.homeGrid}>{apartmentMemberships.map(({ apartment }) => <article className={styles.homeCard} key={apartment.id}><div><span>커뮤니티 참여 중</span><h3>{apartment.name}</h3><p>{apartment.sido} {apartment.sigungu}</p></div><Link href={`/apartments/${apartment.id}/community`}>커뮤니티 들어가기 →</Link></article>)}</div>}</section>
  </div></main>;
}
