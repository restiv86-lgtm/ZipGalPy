import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AllHomesFilter } from "@/components/home/all-homes-filter";
import { RecordPageHeader } from "@/components/home/record-page-header";
import { authOptions } from "@/lib/auth/options";
import { listAllRepairs } from "@/lib/home-management/service";
import styles from "@/app/items/items.module.css";

const labels = { REPAIR: "수리", INSPECTION: "점검", CLEANING: "청소", REPLACEMENT: "교체", OTHER: "기타" };
export default async function RepairsPage({ searchParams }: { searchParams: Promise<{ homeId?: string | string[] }> }) {
  const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login");
  const query = await searchParams; const requestedHomeId = typeof query.homeId === "string" ? query.homeId : undefined;
  const data = await listAllRepairs(session.user.id, requestedHomeId);
  return <main className={styles.page}><div className={styles.shell}>
    <RecordPageHeader eyebrow="ALL HOME REPAIRS" title="수리·점검" description="등록한 모든 집의 수리와 점검 기록을 한곳에서 관리하세요." actionHref={data.homes.length ? "/repairs/new" : undefined} actionLabel="수리 기록" />
    <AllHomesFilter homes={data.homes} activeHomeId={data.homeId} basePath="/repairs" />
    {!data.homes.length ? <section className={styles.empty}><span>🏡</span><h2>먼저 주거공간을 등록해 주세요</h2><p>집을 등록하면 수리와 점검 기록을 관리할 수 있습니다.</p><Link className={styles.primary} href="/home/new">내 집 등록하기</Link></section> : data.repairs.length ? <section className={styles.grid} aria-label="수리·점검 목록">{data.repairs.map((repair) => <Link className={styles.card} href={`/homes/${repair.homeId}/repairs/${repair.id}`} key={repair.id}><div className={styles.cardTop}><span className={styles.badge}>{labels[repair.type]}</span><span className={styles.status}>{repair.cost ? `${Number(repair.cost).toLocaleString("ko-KR")}원` : "비용 미입력"}</span></div><h2>{repair.title}</h2><p className={styles.homeName}><span>🏠</span>{repair.home.name}</p><p className={styles.meta}>{repair.repairDate.toLocaleDateString("ko-KR")}{repair.homeItem ? ` · ${repair.homeItem.name}` : " · 집 전체"}</p></Link>)}</section> : <section className={styles.empty}><span>🔧</span><h2>아직 수리·점검 기록이 없습니다</h2><p>수리와 정기 점검 내역을 남겨보세요.</p><Link className={styles.primary} href="/repairs/new">첫 기록 등록</Link></section>}
  </div></main>;
}
