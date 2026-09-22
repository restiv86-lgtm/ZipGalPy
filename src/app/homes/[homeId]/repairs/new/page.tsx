import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RepairForm } from "@/components/home-management/repair-form";
import { authOptions } from "@/lib/auth/options";
import { listRepairs } from "@/lib/home-management/service";
import styles from "../../items/items.module.css";
export default async function NewRepair({ params }: PageProps<"/homes/[homeId]/repairs/new">) { const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listRepairs(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/repairs`}>← 수리·점검 목록</Link><div className={styles.heading}><div><p className={styles.eyebrow}>{data.home.name}</p><h1>수리·점검 기록</h1></div></div><RepairForm homeId={homeId} items={data.items}/></div></main> }
