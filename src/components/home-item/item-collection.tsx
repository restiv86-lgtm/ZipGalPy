"use client";
import {isMarketplaceActive,marketplaceLabel,marketplaceHref,type MarketplaceLink} from "@/lib/community/marketplace-state";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AppIcon } from "@/components/ui/app-icon";
import styles from "./item-collection.module.css";
export type CollectionItem = {
    id: string;
    homeId: string;
    homeName: string;
    name: string;
    category: string;
    status: string;
    brand: string | null;
    modelName: string | null;
    imageId: string | null;
    marketplacePosts?:MarketplaceLink[];
};
export const itemCategories: Record<string, string> = { APPLIANCE: "가전", FURNITURE: "가구", KITCHEN: "주방", HOUSEHOLD: "생활용품", DIGITAL: "디지털", HOBBY: "취미", CHILDCARE: "육아", OTHER: "기타" };
const statuses: Record<string, string> = { USING: "사용중", STORED: "보관중", REPAIRING: "수리중", SOLD: "판매완료", GIVEN_AWAY: "나눔완료", DISPOSED: "폐기" };
export function filterCollection(items: CollectionItem[], query: string, category: string) { const text = query.trim().toLocaleLowerCase("ko-KR"); return items.filter(item => (!category || item.category === category) && (!text || [item.name, item.brand, item.modelName, item.homeName].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR").includes(text))); }
export function ItemCards({items}:{items:CollectionItem[]}){
  return <div className={styles.grid}>{items.map(item=>{const posts=(item.marketplacePosts??[]).filter(isMarketplaceActive),post=posts[0],detail=`/homes/${item.homeId}/items/${item.id}`;return <article className={styles.card} key={item.id}><Link className={styles.itemLink} href={detail}><div className={styles.photo}>{item.imageId?<Image src={`/api/attachments/${item.imageId}/content`} alt={`${item.name} 대표사진`} width={600} height={600} unoptimized/>:<div className={styles.placeholder}><AppIcon name="box" size={46}/><span>사진을 담아 주세요</span></div>}<span className={styles.status}>{post?marketplaceLabel(post):statuses[item.status]??item.status}</span></div><div className={styles.info}><span className={styles.category}>{itemCategories[item.category]??item.category}</span><h2>{item.name}</h2><p className={styles.model} title={[item.brand,item.modelName].filter(Boolean).join(" · ")}>{[item.brand,item.modelName].filter(Boolean).join(" · ")||"상세 정보를 더해 보세요"}</p><p className={styles.home}><AppIcon name="home" size={14}/>{item.homeName}</p>{post&&<p className={styles.usage}>사용 상태: {statuses[item.status]??item.status}</p>}</div></Link>{post&&<div className={styles.marketLinks}><Link href={marketplaceHref(post)}>{marketplaceLabel(post)} 글 보기 →</Link>{posts.length>1&&<Link href={detail}>진행 중인 글 {posts.length}건 모두 확인</Link>}</div>}</article>;})}</div>;
}
export function ItemCollection({ items }: {
    items: CollectionItem[];
}) { const [query, setQuery] = useState(""), [category, setCategory] = useState(""); const filtered = filterCollection(items, query, category); const categories = Object.entries(itemCategories).filter(([key]) => items.some(item => item.category === key)); return <section aria-label="물건 검색과 목록"><label className={styles.search}><AppIcon name="search"/><span className="sr-only">물건 이름, 모델명, 제조사 검색</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="어떤 물건을 찾으세요?"/></label><div className={styles.filters} aria-label="물건 분류"><button type="button" aria-pressed={!category} onClick={() => setCategory("")}>전체</button>{categories.map(([key, label]) => <button type="button" key={key} aria-pressed={category === key} onClick={() => setCategory(key)}>{label}</button>)}</div><p className={styles.result} role="status">{query || category ? "검색 결과" : "등록된 물건"} <strong>{filtered.length.toLocaleString("ko-KR")}</strong>개</p>{filtered.length ? <ItemCards items={filtered}/> : <div className={styles.empty}><AppIcon name="search" size={36}/><h2>찾으시는 물건이 없어요</h2><p>다른 이름으로 검색하거나 분류를 바꿔 보세요.</p><button type="button" onClick={() => { setQuery(""); setCategory(""); }}>검색 초기화</button></div>}</section>; }
