import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { listRepairs } from "@/lib/home-management/service";
import styles from "../items/items.module.css";

const labels={REPAIR:"수리",INSPECTION:"점검",CLEANING:"청소",REPLACEMENT:"교체",OTHER:"기타"};
export default async function RepairsPage({params}:PageProps<"/homes/[homeId]/repairs">){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listRepairs(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><ManagementPageHeader title="수리·점검" description="우리 집의 수리와 점검 기록을 관리하세요." actionHref={`/homes/${homeId}/repairs/new`} actionLabel="수리 기록"/>{data.repairs.length?<div className={styles.grid}>{data.repairs.map(repair=><Link className={styles.card} href={`/homes/${homeId}/repairs/${repair.id}/edit`} key={repair.id}><span className={styles.badge}>{labels[repair.type]}</span><h2>{repair.title}</h2><span className={styles.meta}>{repair.repairDate.toLocaleDateString("ko-KR")}{repair.homeItem?` · ${repair.homeItem.name}`:" · 집 전체"}</span><strong>{repair.cost?`${Number(repair.cost).toLocaleString("ko-KR")}원`:"비용 미입력"}</strong></Link>)}</div>:<ManagementEmptyState icon="🔧" title="아직 수리·점검 기록이 없습니다." description="수리와 정기 점검 내역을 남겨보세요." actionHref={`/homes/${homeId}/repairs/new`} actionLabel="첫 기록 등록"/>}</div></main>}
