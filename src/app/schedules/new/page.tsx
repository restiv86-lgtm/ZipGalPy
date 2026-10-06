import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScheduleForm } from "@/components/home-management/schedule-form";
import { authOptions } from "@/lib/auth/options";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/items/items.module.css";
export default async function NewSchedulePage() { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const homes = await listRecordHomeOptions(session.user.id); if (!homes.length) redirect("/home/new"); return <main className={styles.page}><div className={styles.formShell}><Link className={styles.back} href="/schedules">← 일정 전체 목록</Link><div className={styles.formHeader}><p className={styles.eyebrow}>NEW SCHEDULE</p><h1>일정 등록</h1><p>일정이 속한 집을 선택하고 정보를 입력해 주세요.</p></div><ScheduleForm homeId={homes[0].id} homes={homes} /></div></main>; }
