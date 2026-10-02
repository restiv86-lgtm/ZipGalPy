import Link from "next/link";
import { HomeSwitcher } from "./home-switcher";
import styles from "./home-management-nav.module.css";

type HomeManagementNavProps = {
  homeId: string;
  homeName: string;
  current: string;
  listHref?: string;
  listLabel?: string;
  homes?: { id: string; name: string }[];
};

export function HomeManagementNav({ homeId, homeName, current, listHref, listLabel, homes = [] }: HomeManagementNavProps) {
  return (
    <div className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href={`/dashboard?homeId=${homeId}`}>Dashboard</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/home/${homeId}/edit`}>{homeName}</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">{current}</span>
      </nav>
      <div className={styles.actions}>
        {listHref && listLabel ? <Link href={listHref}>← {listLabel}</Link> : null}
        <Link href={`/dashboard?homeId=${homeId}`}>← Dashboard</Link>
        <Link href="/">홈페이지</Link>
        <Link href={`/home/${homeId}/edit`}>집 정보</Link>
      </div>
      <HomeSwitcher currentHomeId={homeId} homes={homes} hideOnItemNew />
      <nav className={styles.sectionNav} aria-label={`${homeName} 관리 메뉴`}>
        <Link href={`/homes/${homeId}/items`}>물건</Link>
        <Link href={`/homes/${homeId}/repairs`}>수리·점검</Link>
        <Link href={`/homes/${homeId}/schedules`}>일정</Link>
        <Link href={`/homes/${homeId}/expenses`}>비용</Link>
        <Link href={`/homes/${homeId}/contracts`}>계약</Link>
        <Link href={`/homes/${homeId}/documents`}>문서</Link>
      </nav>
    </div>
  );
}
