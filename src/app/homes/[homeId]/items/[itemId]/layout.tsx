import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth/options";
import { getOwnedItem } from "@/lib/home-item/service";
import styles from "../items.module.css";

export default async function ItemLayout({ children, params }: LayoutProps<"/homes/[homeId]/items/[itemId]">) {
  const session = await getServerSession(authOptions);
  const { homeId, itemId } = await params;
  const item = session?.user?.id ? await getOwnedItem(session.user.id, homeId, itemId) : null;
  return <>{children}{item&&<aside className={styles.shell} aria-labelledby="repair-history-title"><section className={styles.detail}><div className={styles.heading}><div><p className={styles.eyebrow}>{item.name}</p><h2 id="repair-history-title">수리·점검 이력</h2></div><Link className={styles.primary} href={`/homes/${homeId}/repairs/new`}>+ 기록 등록</Link></div>{item.repairs.length?<div className={styles.grid}>{item.repairs.map(repair=><Link className={styles.card} href={`/homes/${homeId}/repairs/${repair.id}/edit`} key={repair.id}><strong>{repair.title}</strong><span className={styles.meta}>{repair.repairDate.toLocaleDateString("ko-KR")}{repair.cost?` · ${Number(repair.cost).toLocaleString("ko-KR")}원`:""}</span></Link>)}</div>:<p className={styles.meta}>아직 이 물건에 연결된 기록이 없습니다.</p>}</section></aside>}</>;
}
