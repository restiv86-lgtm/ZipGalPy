import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listUserApartmentMemberships } from "@/lib/apartment/service";
import { authOptions } from "@/lib/auth/options";
import { listHomes } from "@/lib/home/service";
import { dashboardManagement } from "@/lib/home-management/service";
import { expenseTotals } from "@/lib/home-expense/service";
import { listAllOwnedItems } from "@/lib/home-item/service";
import { ItemCards } from "@/components/home-item/item-collection";
import { AppIcon, type AppIconName } from "@/components/ui/app-icon";
import styles from "./dashboard.module.css";
export const metadata: Metadata = { title: "우리 집의 책갈피 | 집갈피", robots: { index: false, follow: false } };
const housingLabels: Record<string, string> = { APARTMENT: "아파트", VILLA: "빌라", DETACHED_HOUSE: "단독주택", OFFICETEL: "오피스텔", OTHER: "기타" };
const menus: {
    href: string;
    icon: AppIconName;
    title: string;
    description: string;
}[] = [{ href: "/items", icon: "box", title: "내 물건", description: "사진으로 정리하는 물건" }, { href: "/repairs", icon: "tool", title: "수리·점검", description: "잊지 않고 남기는 관리 이력" }, { href: "/schedules", icon: "calendar", title: "일정", description: "다가오는 우리 집의 할 일" }, { href: "/expenses", icon: "wallet", title: "비용", description: "집에 쓰인 비용 모아보기" }, { href: "/contracts", icon: "file", title: "계약", description: "중요한 계약과 만료일" }, { href: "/documents", icon: "file", title: "문서", description: "필요할 때 찾는 집의 서류" }];
export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        redirect("/login");
    const [homes, memberships, management, expenses, collection] = await Promise.all([listHomes(session.user.id), listUserApartmentMemberships(session.user.id), dashboardManagement(session.user.id), expenseTotals(session.user.id), listAllOwnedItems(session.user.id)]);
    const recent = collection.items.slice(0, 4).map(item => ({ id: item.id, homeId: item.homeId, homeName: item.home.name, name: item.name, category: item.category, status: item.status, brand: item.brand, modelName: item.modelName, imageId: item.images[0]?.id ?? null, marketplacePosts:item.marketplacePosts }));
    const counts = [{ href: "/items", label: "물건", value: `${management.countItems.toLocaleString("ko-KR")}개` }, { href: "/repairs", label: "수리·점검", value: `${management.countRepairs.toLocaleString("ko-KR")}건` }, { href: "/schedules", label: "남은 일정", value: `${management.countSchedules.toLocaleString("ko-KR")}건` }, { href: "/documents", label: "문서", value: `${management.countDocuments.toLocaleString("ko-KR")}개` }, { href: "/expenses?period=month", label: "이번 달 비용", value: `${expenses.month.toLocaleString("ko-KR")}원` }, { href: "/contracts", label: "계약", value: `${management.countContracts.toLocaleString("ko-KR")}건` }];
    return <main className={styles.page}><div className={`${styles.container} ${styles.content}`}>
    <section className={styles.welcome}><p className={styles.eyebrow}>HOME, BOOKMARKED</p><h1>{session.user.name ?? "회원"}님의 집에<br />이야기를 담아 보세요.</h1><p>아끼는 물건부터 중요한 기록까지,<br />우리 집의 모든 정보를 한 장씩 모아요.</p><Link className={styles.primaryLink} href={homes.length ? "/items/new" : "/home/new"}><AppIcon name="plus" size={18}/>{homes.length ? "새 물건 담기" : "내 집 등록하기"}</Link><div className={styles.homeSummary}><AppIcon name="home" size={20}/><span>등록한 공간 <b>{homes.length.toLocaleString("ko-KR")}</b>곳</span><span>함께하는 물건 <b>{management.countItems.toLocaleString("ko-KR")}</b>개</span></div></section>
    <section aria-labelledby="recent-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>RECENTLY ADDED</p><h2 id="recent-title">최근 담은 물건</h2></div><Link className={styles.textLink} href="/items">모두 보기 <AppIcon name="arrow" size={17}/></Link></div>{recent.length ? <ItemCards items={recent}/> : <div className={styles.empty}><AppIcon name="camera" size={38}/><h3>사진 한 장으로 시작해요</h3><p>등록한 물건이 이곳에 차곡차곡 모입니다.</p><Link className={styles.primaryLink} href={homes.length ? "/items/new" : "/home/new"}>{homes.length ? "첫 물건 추가" : "내 집 등록"}</Link></div>}</section>
    <section aria-labelledby="status-title"><div className={styles.sectionHeading}><h2 id="status-title">우리 집 한눈에</h2></div><div className={styles.compactStatusGrid}>{counts.map(card => <Link className={styles.compactStatusCard} href={card.href} key={card.href}><span>{card.label}</span><strong>{card.value}</strong></Link>)}</div></section>
    <section aria-labelledby="menu-title"><div className={styles.sectionHeading}><h2 id="menu-title">집을 돌보는 기록</h2><Link className={styles.textLink} href="/feedback?from=/dashboard">의견 보내기</Link></div><div className={styles.menuGrid}>{menus.map(menu => <Link href={menu.href} key={menu.href}><AppIcon name={menu.icon} size={25}/><strong>{menu.title}</strong><small>{menu.description}</small></Link>)}</div></section>
    <section aria-labelledby="homes-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>MY SPACES</p><h2 id="homes-title">나의 공간</h2></div><Link className={styles.textLink} href="/home/new"><AppIcon name="plus" size={18}/> 집 등록</Link></div>{homes.length ? <div className={styles.homeGrid}>{homes.map(home => <article className={styles.homeCard} key={home.id}><div><span>{housingLabels[home.housingType] ?? "주거공간"}</span><h3>{home.name}</h3><p>{home.address}{home.addressDetail ? ` ${home.addressDetail}` : ""}</p></div><dl><div><dt>면적</dt><dd>{home.area ? `${home.area}㎡` : "미입력"}</dd></div><div><dt>준공</dt><dd>{home.builtYear ? `${home.builtYear}년` : "미입력"}</dd></div></dl><div className={styles.homeLinks}><Link href={`/items?homeId=${home.id}`}>물건 보기 <AppIcon name="arrow" size={15}/></Link><Link href={`/home/${home.id}/edit`}>집 정보 수정</Link></div></article>)}</div> : <div className={styles.empty}><AppIcon name="home" size={36}/><h3>첫 번째 공간을 등록해요</h3><p>집 정보와 생활 기록은 나의 공간에서 관리합니다.</p><Link className={styles.primaryLink} href="/home/new">내 집 등록</Link></div>}</section>
    <section aria-labelledby="apartment-title"><div className={styles.sectionHeading}><h2 id="apartment-title">우리 동네 이웃</h2><Link className={styles.textLink} href="/apartments">커뮤니티 찾기 <AppIcon name="arrow" size={17}/></Link></div>{memberships.length ? <div className={styles.homeGrid}>{memberships.map(({ apartment }) => <article className={styles.homeCard} key={apartment.id}><div><span>커뮤니티 연결 중</span><h3>{apartment.name}</h3><p>{apartment.sido} {apartment.sigungu}</p></div><Link href={`/apartments/${apartment.id}/community`}>커뮤니티 들어가기 →</Link></article>)}</div> : <p className={styles.selectedHome}>아파트 커뮤니티를 연결하면 게시판과 장터를 이용할 수 있어요. 개인 집 관리와 별도로 운영됩니다.</p>}</section>
  </div></main>;
}
