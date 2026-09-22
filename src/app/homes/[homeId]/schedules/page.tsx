import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { listSchedules } from "@/lib/home-management/service";
import styles from "../items/items.module.css";
const labels={INSPECTION:"점검",WARRANTY:"보증",REPAIR:"수리",CONTRACT:"계약",PAYMENT:"납부",OTHER:"기타"};
export default async function SchedulesPage({params}:PageProps<"/homes/[homeId]/schedules">){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listSchedules(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href="/dashboard">← Dashboard</Link><div className={styles.heading}><div><p className={styles.eyebrow}>{data.home.name}</p><h1>일정</h1></div><Link className={styles.primary} href={`/homes/${homeId}/schedules/new`}>+ 일정 등록</Link></div>{data.schedules.length?<div className={styles.grid}>{data.schedules.map(schedule=><Link className={styles.card} href={`/homes/${homeId}/schedules/${schedule.id}/edit`} key={schedule.id}><span className={styles.badge}>{labels[schedule.type]}</span><h2>{schedule.title}</h2><span className={styles.meta}>{schedule.scheduledAt.toLocaleString("ko-KR")}{schedule.homeItem?` · ${schedule.homeItem.name}`:""}</span><strong>{schedule.completed?"완료":"예정"}</strong></Link>)}</div>:<div className={styles.empty}>등록된 일정이 없습니다.</div>}</div></main>}
