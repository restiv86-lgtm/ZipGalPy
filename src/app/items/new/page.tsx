import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeItemForm } from "@/components/home-item/home-item-form";
import { authOptions } from "@/lib/auth/options";
import { listHomes } from "@/lib/home/service";
import styles from "../items.module.css";

export default async function NewAllItemPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const homes = await listHomes(session.user.id);
  if (homes.length === 0) redirect("/home/new");
  return <main className={styles.page}><div className={styles.formShell}><Link className={styles.back} href="/items">← 우리집 물건 전체 목록</Link><div className={styles.formHeader}><p className={styles.eyebrow}>NEW ITEM</p><h1>물건 등록</h1><p>물건이 있는 집을 먼저 선택하고 정보를 입력해 주세요.</p></div><HomeItemForm homeId={homes[0].id} homes={homes.map(({ id, name }) => ({ id, name }))} requireHomeSelection={homes.length > 1} /></div></main>;
}
