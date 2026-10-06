import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecordDeleteButton } from "@/components/home-management/record-delete-button";
import { ScheduleForm } from "@/components/home-management/schedule-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedSchedule } from "@/lib/home-management/service";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export default async function EditSchedule({ params }: PageProps<"/homes/[homeId]/schedules/[scheduleId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, scheduleId } = await params; const [schedule, homes] = await Promise.all([getOwnedSchedule(session.user.id, homeId, scheduleId), listRecordHomeOptions(session.user.id)]); if (!schedule) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/schedules/${scheduleId}`}>← 일정 상세</Link><div className={styles.heading}><h1>일정 수정</h1><RecordDeleteButton homeId={homeId} id={scheduleId} kind="schedules" /></div><ScheduleForm homeId={homeId} homes={homes} schedule={schedule} /></div></main>; }
