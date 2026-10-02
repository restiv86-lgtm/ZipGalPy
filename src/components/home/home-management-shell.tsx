"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./home-management-shell.module.css";

type HomeSummary = {
  id: string;
  name: string;
  address: string;
  housingType: string;
  area: number | null;
};

type Counts = {
  items: number;
  repairs: number;
  schedules: number;
  expenses: number;
  contracts: number;
  documents: number;
};

const sections = [
  ["items", "물건", "📦"],
  ["repairs", "수리·점검", "🔧"],
  ["schedules", "일정", "📅"],
  ["expenses", "비용", "💰"],
  ["contracts", "계약", "📝"],
  ["documents", "문서", "📄"],
] as const;

const housingLabels: Record<string, string> = {
  APARTMENT: "아파트",
  VILLA: "빌라",
  DETACHED_HOUSE: "단독주택",
  OFFICETEL: "오피스텔",
  OTHER: "기타",
};

export function HomeManagementShell({
  home,
  homes,
  counts,
}: {
  home: HomeSummary;
  homes: HomeSummary[];
  counts: Counts;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = sections.find(([key]) => pathname.includes(`/homes/${home.id}/${key}`)) ?? sections[0];

  function changeHome(nextHomeId: string) {
    router.push(`/homes/${nextHomeId}/${active[0]}`);
  }

  return (
    <section className={styles.shell} aria-label={`${home.name} 집 관리`}>
      <div className={styles.topNavigation}>
        <Link
          className={styles.dashboardLink}
          href={`/dashboard?homeId=${home.id}`}
          aria-label={`${home.name}이 선택된 Dashboard로 이동`}
        >
          <span aria-hidden="true">←</span>
          <span>Dashboard</span>
        </Link>
        <div className={styles.currentContext} aria-label={`현재 ${home.name}의 ${active[1]} 관리 화면`}>
          <span className={styles.currentHomeIcon} aria-hidden="true">🏠</span>
          <span>
            <strong>{home.name}</strong>
            <small>{active[1]} 관리</small>
          </span>
        </div>
      </div>

      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href={`/dashboard?homeId=${home.id}`}>Dashboard</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/dashboard?homeId=${home.id}`}>{home.name}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{active[1]}</span>
      </nav>

      <div className={styles.titleRow}>
        <div>
          <p className={styles.eyebrow}>내 집 관리</p>
          <h2><span aria-hidden="true">🏠</span> {home.name}</h2>
          <p className={styles.address}>{home.address}</p>
          <p className={styles.meta}>{housingLabels[home.housingType] ?? "주거공간"}{home.area ? ` · ${home.area}㎡` : ""}</p>
        </div>
        <Link className={styles.editLink} href={`/home/${home.id}/edit`}>집 정보 수정</Link>
      </div>

      {homes.length > 1 ? (
        <div className={styles.homePicker} aria-label="관리할 집 선택">
          {homes.map((candidate) => (
            <button
              type="button"
              key={candidate.id}
              className={candidate.id === home.id ? styles.selectedHome : undefined}
              aria-pressed={candidate.id === home.id}
              onClick={() => changeHome(candidate.id)}
            >
              <span aria-hidden="true">🏠</span>
              <span>{candidate.name}</span>
            </button>
          ))}
        </div>
      ) : null}

      <nav className={styles.sectionNav} aria-label={`${home.name} 관리 메뉴`}>
        {sections.map(([key, label, icon]) => (
          <Link
            key={key}
            href={`/homes/${home.id}/${key}`}
            className={active[0] === key ? styles.active : undefined}
            aria-current={active[0] === key ? "page" : undefined}
          >
            <span aria-hidden="true">{icon}</span>{label}
          </Link>
        ))}
      </nav>

      <div className={styles.summary} aria-label="집 관리 현황">
        {sections.map(([key, label]) => (
          <Link key={key} href={`/homes/${home.id}/${key}`}>
            <span>{label}</span><strong>{counts[key]}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}
