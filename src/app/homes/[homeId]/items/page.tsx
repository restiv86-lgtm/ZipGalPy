import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { listOwnedItems } from "@/lib/home-item/service";
import styles from "./items.module.css";

const category={APPLIANCE:"가전",FURNITURE:"가구",KITCHEN:"주방",HOUSEHOLD:"생활용품",DIGITAL:"디지털",HOBBY:"취미",CHILDCARE:"육아",OTHER:"기타"};
const status={USING:"사용중",STORED:"보관중",REPAIRING:"수리중",SOLD:"판매완료",GIVEN_AWAY:"나눔완료",DISPOSED:"폐기"};

export default async function ItemsPage({params}:PageProps<"/homes/[homeId]/items">){
  const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");
  const{homeId}=await params;const data=await listOwnedItems(session.user.id,homeId);if(!data)notFound();
  return <main className={styles.page}><div className={styles.shell}>
    <ManagementPageHeader title="우리집 물건" description="가전과 가구, 생활용품을 한곳에 기록하고 관리하세요." actionHref={`/homes/${homeId}/items/new`} actionLabel="물건 등록"/>
    {data.items.length?<div className={styles.grid}>{data.items.map(item=><Link className={styles.card} href={`/homes/${homeId}/items/${item.id}`} key={item.id}><span className={styles.badge}>{category[item.category]}</span><h2>{item.name}</h2><span className={styles.meta}>{[item.brand,item.modelName].filter(Boolean).join(" · ")||"제품 정보 미입력"}</span><strong>{status[item.status]}</strong></Link>)}</div>:<ManagementEmptyState icon="📦" title="아직 등록된 물건이 없습니다." description="우리 집의 물건을 기록해보세요." actionHref={`/homes/${homeId}/items/new`} actionLabel="첫 물건 등록"/>}
  </div></main>;
}
