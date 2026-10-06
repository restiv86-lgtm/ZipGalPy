import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecordDeleteButton } from "@/components/home-management/record-delete-button";
import { RepairForm } from "@/components/home-management/repair-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedRepair } from "@/lib/home-management/service";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export default async function EditRepair({ params }: PageProps<"/homes/[homeId]/repairs/[repairId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, repairId } = await params; const [repair, homes] = await Promise.all([getOwnedRepair(session.user.id, homeId, repairId), listRecordHomeOptions(session.user.id)]); if (!repair) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/repairs/${repairId}`}>← 수리·점검 상세</Link><div className={styles.heading}><h1>기록 수정</h1><RecordDeleteButton homeId={homeId} id={repairId} kind="repairs" /></div><RepairForm homeId={homeId} homes={homes} repair={repair} /></div></main>; }
