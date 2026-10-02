import Link from "next/link";
import styles from "./home-management-nav.module.css";

type HomeManagementNavProps = {
  homeId: string;
  homeName: string;
  current: string;
  listHref?: string;
  listLabel?: string;
  homes?: { id: string; name: string }[];
};

export function HomeManagementNav({ homeId, homeName }: HomeManagementNavProps) {
  return (
    <div className={styles.wrap}>
      <nav className={styles.breadcrumb} aria-label="현재 위치">
        <Link href="/dashboard">Dashboard</Link><span aria-hidden="true">›</span><span aria-current="page">{homeName} 집 정보 수정</span>
      </nav>
      <div className={styles.actions}><Link href="/dashboard">← Dashboard</Link><Link href="/items">집 관리로 이동</Link></div>
      <nav className={styles.sectionNav} aria-label={`${homeName} 관리 메뉴`}>
        <Link href="/items">물건</Link>
        <Link href={`/homes/${homeId}/repairs`}>수리·점검</Link>
        <Link href={`/homes/${homeId}/schedules`}>일정</Link>
        <Link href={`/homes/${homeId}/expenses`}>비용</Link>
        <Link href={`/homes/${homeId}/contracts`}>계약</Link>
        <Link href={`/homes/${homeId}/documents`}>문서</Link>
      </nav>
    </div>
  );
}
