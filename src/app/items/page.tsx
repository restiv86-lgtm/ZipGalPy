import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import photos from "@/components/home-item/item-photos.module.css";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { listAllOwnedItems } from "@/lib/home-item/service";
import styles from "./items.module.css";

export const metadata: Metadata = { title: "우리집 물건 | 집갈피", robots: { index: false, follow: false } };
const category: Record<string, string> = { APPLIANCE: "가전", FURNITURE: "가구", KITCHEN: "주방", HOUSEHOLD: "생활용품", DIGITAL: "디지털", HOBBY: "취미", CHILDCARE: "육아", OTHER: "기타" };
const status: Record<string, string> = { USING: "사용중", STORED: "보관중", REPAIRING: "수리중", SOLD: "판매완료", GIVEN_AWAY: "나눔완료", DISPOSED: "폐기" };

export default async function AllItemsPage({ searchParams }: { searchParams: Promise<{ homeId?: string | string[] }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const query = await searchParams;
  const requestedHomeId = typeof query.homeId === "string" ? query.homeId : undefined;
  const data = await listAllOwnedItems(session.user.id, requestedHomeId);

  return <main className={styles.page}><div className={styles.shell}>
    <Link className={styles.back} href="/dashboard">← Dashboard</Link>
    <div className={styles.pageHeader}><div><p className={styles.eyebrow}>ALL MY ITEMS</p><h1>우리집 물건</h1><p>등록한 모든 집의 물건을 한곳에서 관리하세요.</p></div>{data.homes.length > 0 && <Link className={styles.primary} href="/items/new">+ 물건 등록</Link>}</div>
    {data.homes.length > 1 && <nav className={styles.filters} aria-label="집별 물건 필터"><Link className={!data.homeId ? styles.activeFilter : undefined} aria-current={!data.homeId ? "page" : undefined} href="/items">전체</Link>{data.homes.map((home) => <Link className={data.homeId === home.id ? styles.activeFilter : undefined} aria-current={data.homeId === home.id ? "page" : undefined} href={`/items?homeId=${home.id}`} key={home.id}>{home.name}</Link>)}</nav>}
    {data.homes.length === 0 ? <section className={styles.empty}><span aria-hidden="true">🏡</span><h2>먼저 주거공간을 등록해 주세요</h2><p>집을 등록하면 물건과 보증 정보를 관리할 수 있습니다.</p><Link className={styles.primary} href="/home/new">내 집 등록하기</Link></section> : data.items.length === 0 ? <section className={styles.empty}><span aria-hidden="true">📦</span><h2>{data.homeId ? "이 집에 등록된 물건이 없습니다" : "아직 등록된 물건이 없습니다"}</h2><p>가전과 가구, 생활용품을 기록해보세요.</p><Link className={styles.primary} href="/items/new">첫 물건 등록</Link></section> : <section className={styles.grid} aria-label="우리집 물건 목록">{data.items.map((item) => <Link className={styles.card} href={`/homes/${item.homeId}/items/${item.id}`} key={item.id}>{item.images[0]?<Image className={photos.thumbnail} src={`/api/attachments/${item.images[0].id}/content`} alt={`${item.name} 대표사진`} width={320} height={180} unoptimized/>:<span className={photos.placeholder} aria-hidden="true">📦</span>}<div className={styles.cardTop}><span className={styles.badge}>{category[item.category]}</span><span className={styles.status}>{status[item.status]}</span></div><h2>{item.name}</h2><p className={styles.homeName}><span aria-hidden="true">🏠</span>{item.home.name}</p><p className={styles.meta}>{[item.brand, item.modelName].filter(Boolean).join(" · ") || "브랜드·모델 미입력"}</p></Link>)}</section>}
  </div></main>;
}
