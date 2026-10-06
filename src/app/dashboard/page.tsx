import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserApartmentMemberships } from "@/lib/apartment/service";
import { authOptions } from "@/lib/auth/options";
import { listHomes } from "@/lib/home/service";
import { dashboardManagement } from "@/lib/home-management/service";
import { expenseTotals } from "@/lib/home-expense/service";
import styles from "./dashboard.module.css";

export const metadata: Metadata = {
  title: "Dashboard | 집갈피",
  robots: { index: false, follow: false },
};

const housingLabels: Record<string, string> = {
  APARTMENT: "아파트",
  VILLA: "빌라",
  DETACHED_HOUSE: "단독주택",
  OFFICETEL: "오피스텔",
  OTHER: "기타",
};

const managementMenus = [
  { href: "/items", icon: "📦", title: "우리집 물건", description: "모든 집의 물건과 보증 정보" },
  { href: "/repairs", icon: "🔧", title: "수리/점검", description: "모든 집의 수리와 점검 이력" },
  { href: "/schedules", icon: "📅", title: "일정", description: "점검과 생활 일정 관리" },
  { href: "/expenses", icon: "💰", title: "비용", description: "모든 집의 지출 관리" },
  { href: "/contracts", icon: "📝", title: "계약", description: "계약과 만료일 관리" },
  { href: "/documents", icon: "📄", title: "문서", description: "문서 정보와 만료일 관리" },
] as const;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [homes, apartmentMemberships, management, expenses] = await Promise.all([
    listHomes(session.user.id),
    listUserApartmentMemberships(session.user.id),
    dashboardManagement(session.user.id),
    expenseTotals(session.user.id),
  ]);

  const statusCards = [
    { href: "/items", label: "물건", value: `${management.countItems.toLocaleString("ko-KR")}개`, detail: "전체 물건 보기" },
    { href: "/repairs", label: "수리·점검", value: `${management.countRepairs.toLocaleString("ko-KR")}개`, detail: "수리·점검 보기" },
    { href: "/schedules", label: "일정", value: `${management.countSchedules.toLocaleString("ko-KR")}개`, detail: "미완료 일정 보기" },
    { href: "/documents", label: "문서", value: `${management.countDocuments.toLocaleString("ko-KR")}개`, detail: "문서 보기" },
    { href: "/expenses?period=month", label: "이번 달 비용", value: `${expenses.month.toLocaleString("ko-KR")}원`, detail: "이번 달 비용 보기" },
    { href: "/contracts", label: "계약", value: `${management.countContracts.toLocaleString("ko-KR")}개`, detail: "계약 보기" },
  ] as const;

  return (
    <main className={styles.page}>
      <div className={`${styles.container} ${styles.content}`}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>MY ZIPGALPY</p>
          <h1>안녕하세요, {session.user.name ?? "회원"}님</h1>
          <p>등록한 모든 집의 정보와 생활 기록을 한곳에서 확인하세요.</p>
          <Link className={`${styles.primaryLink} ${styles.feedbackLink}`} href="/feedback?from=/dashboard">의견 보내기</Link>
        </section>

        <section aria-labelledby="homes-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>PRIVATE HOME</p>
              <h2 id="homes-title">내 주거공간 관리</h2>
              <p className={styles.selectedHome}>아파트·빌라·단독주택 등 내 생활 정보를 비공개로 관리합니다.</p>
            </div>
            <Link className={styles.primaryLink} href="/home/new">+ 주거공간 등록</Link>
          </div>
          {homes.length === 0 ? (
            <div className={styles.empty}>
              <span aria-hidden="true">🏡</span>
              <h3>첫 번째 집을 등록해보세요</h3>
              <p>주소와 기본 정보를 등록하면 집갈피 생활 관리가 시작됩니다.</p>
              <Link className={styles.primaryLink} href="/home/new">내 집 등록하기</Link>
            </div>
          ) : (
            <div className={styles.homeGrid}>
              {homes.map((home) => (
                <article className={styles.homeCard} key={home.id}>
                  <div>
                    <span>{housingLabels[home.housingType]}</span>
                    <h3>{home.name}</h3>
                    <p>{home.address}{home.addressDetail ? ` ${home.addressDetail}` : ""}</p>
                  </div>
                  <dl>
                    <div><dt>면적</dt><dd>{home.area ? `${home.area}㎡` : "미입력"}</dd></div>
                    <div><dt>준공</dt><dd>{home.builtYear ? `${home.builtYear}년` : "미입력"}</dd></div>
                  </dl>
                  <Link href={`/home/${home.id}/edit`}>집 정보 수정 →</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="status-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>ALL HOMES OVERVIEW</p>
              <h2 id="status-title">전체 집 관리현황</h2>
              <p className={styles.selectedHome}>등록한 모든 주거공간의 실제 합계입니다.</p>
            </div>
          </div>
          <div className={styles.compactStatusGrid}>
            {statusCards.map((card) => (
              <Link className={styles.compactStatusCard} href={card.href} key={card.href} aria-label={`${card.label} ${card.value} ${card.detail}`}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="menu-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>SERVICES</p>
              <h2 id="menu-title">집 관리 메뉴</h2>
              <p className={styles.selectedHome}>집을 따로 선택하지 않아도 모든 기록을 통합해서 관리할 수 있습니다.</p>
            </div>
          </div>
          <div className={styles.menuGrid}>
            {managementMenus.map((menu) => (
              <Link href={menu.href} key={menu.href}>
                <span aria-hidden="true">{menu.icon}</span>
                <strong>{menu.title}</strong>
                <small>{menu.description}</small>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="apartment-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>APARTMENT COMMUNITY</p>
              <h2 id="apartment-title">아파트 커뮤니티</h2>
              <p className={styles.selectedHome}>게시판과 장터를 이용할 아파트를 선택하는 선택형 공간입니다.</p>
            </div>
            <Link className={styles.primaryLink} href="/apartments">커뮤니티 찾기</Link>
          </div>
          {apartmentMemberships.length === 0 ? (
            <div className={styles.empty}>
              <span aria-hidden="true">🏢</span>
              <h3>참여할 아파트 커뮤니티를 찾아보세요</h3>
              <p>개인 주거정보와 분리된 아파트 게시판·장터에 참여할 수 있습니다.</p>
              <Link className={styles.primaryLink} href="/apartments">아파트 검색하기</Link>
            </div>
          ) : (
            <div className={styles.homeGrid}>
              {apartmentMemberships.map(({ apartment }) => (
                <article className={styles.homeCard} key={apartment.id}>
                  <div>
                    <span>커뮤니티 참여 중</span>
                    <h3>{apartment.name}</h3>
                    <p>{apartment.sido} {apartment.sigungu}</p>
                  </div>
                  <Link href={`/apartments/${apartment.id}/community`}>커뮤니티 들어가기 →</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
