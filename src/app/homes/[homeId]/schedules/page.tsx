import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { listSchedules } from "@/lib/home-management/service";
import styles from "../items/items.module.css";

const labels={INSPECTION:"점검",WARRANTY:"보증",REPAIR:"수리",CONTRACT:"계약",PAYMENT:"납부",OTHER:"기타"};
export default async function SchedulesPage({params}:PageProps<"/homes/[homeId]/schedules">){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listSchedules(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><ManagementPageHeader title="일정" description="점검·계약·납부 일정을 놓치지 않도록 관리하세요." actionHref={`/homes/${homeId}/schedules/new`} actionLabel="일정 등록"/>{data.schedules.length?<div className={styles.grid}>{data.schedules.map(schedule=><Link className={styles.card} href={`/homes/${homeId}/schedules/${schedule.id}/edit`} key={schedule.id}><span className={styles.badge}>{labels[schedule.type]}</span><h2>{schedule.title}</h2><span className={styles.meta}>{schedule.scheduledAt.toLocaleString("ko-KR")}{schedule.homeItem?` · ${schedule.homeItem.name}`:""}</span><strong>{schedule.completed?"완료":"예정"}</strong></Link>)}</div>:<ManagementEmptyState icon="📅" title="아직 등록된 일정이 없습니다." description="점검과 납부 같은 중요한 일정을 등록해보세요." actionHref={`/homes/${homeId}/schedules/new`} actionLabel="첫 일정 등록"/>}</div></main>}
