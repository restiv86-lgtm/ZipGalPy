import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RepairForm } from "@/components/home-management/repair-form";
import { authOptions } from "@/lib/auth/options";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/items/items.module.css";
export default async function NewRepairPage() { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const homes = await listRecordHomeOptions(session.user.id); if (!homes.length) redirect("/home/new"); return <main className={styles.page}><div className={styles.formShell}><Link className={styles.back} href="/repairs">← 수리·점검 전체 목록</Link><div className={styles.formHeader}><p className={styles.eyebrow}>NEW REPAIR</p><h1>수리·점검 기록</h1><p>기록할 집을 선택하고 수리·점검 정보를 입력해 주세요.</p></div><RepairForm homeId={homes[0].id} homes={homes} /></div></main>; }
