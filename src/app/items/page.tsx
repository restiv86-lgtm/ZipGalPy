import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { listAllOwnedItems } from "@/lib/home-item/service";
import { ItemCollection } from "@/components/home-item/item-collection";
import { AppIcon } from "@/components/ui/app-icon";
import styles from "./items.module.css";
export const metadata: Metadata = { title: "내 물건 | 집갈피", robots: { index: false, follow: false } };
export default async function AllItemsPage({ searchParams }: {
    searchParams: Promise<{
        homeId?: string | string[];
    }>;
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        redirect("/login");
    const query = await searchParams;
    const data = await listAllOwnedItems(session.user.id, typeof query.homeId === "string" ? query.homeId : undefined);
    const items = data.items.map(item => ({ id: item.id, homeId: item.homeId, homeName: item.home.name, name: item.name, category: item.category, status: item.status, brand: item.brand, modelName: item.modelName, imageId: item.images[0]?.id ?? null, marketplacePosts:item.marketplacePosts }));
    return <main className={styles.page}><div className={styles.shell}><div className={styles.pageHeader}><div><p className={styles.eyebrow}>MY COLLECTION</p><h1>내 물건</h1><p>매일 쓰는 물건도, 오래 간직할 물건도.<br />사진과 함께 우리 집의 물건을 정리해요.</p></div>{data.homes.length > 0 && <Link className={styles.primary} href="/items/new"><AppIcon name="plus" size={18}/> 물건 추가</Link>}</div>
    {data.homes.length > 0 && <nav className={styles.filters} aria-label="공간별 물건"><Link className={!data.homeId ? styles.activeFilter : undefined} aria-current={!data.homeId ? "page" : undefined} href="/items">모든 공간</Link>{data.homes.map(home => <Link className={data.homeId === home.id ? styles.activeFilter : undefined} aria-current={data.homeId === home.id ? "page" : undefined} href={`/items?homeId=${home.id}`} key={home.id}><AppIcon name="home" size={15}/>{home.name}</Link>)}</nav>}
    {!data.homes.length ? <section className={styles.empty}><AppIcon name="home" size={42}/><h2>물건을 담을 집부터 등록해요</h2><p>등록한 집을 기준으로 물건을 나누어 볼 수 있어요.</p><Link className={styles.primary} href="/home/new">내 집 등록하기</Link></section> : !items.length ? <section className={styles.empty}><AppIcon name="box" size={42}/><h2>첫 물건을 담아 볼까요?</h2><p>사진 한 장과 이름으로 가볍게 시작해요.</p><Link className={styles.primary} href="/items/new"><AppIcon name="plus" size={18}/> 물건 추가하기</Link></section> : <ItemCollection items={items}/>}</div></main>;
}
