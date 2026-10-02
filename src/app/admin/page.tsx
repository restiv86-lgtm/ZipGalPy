import type {Metadata} from "next";
import Link from "next/link";
import {AdminHeader} from "@/components/admin/admin-header";
import {getAdminDashboard} from "@/lib/admin/service";
import styles from "./admin.module.css";
export const metadata:Metadata={title:"운영 관리 | 집갈피",robots:{index:false,follow:false}};
export default async function AdminPage(){const data=await getAdminDashboard();const cards=[{label:"전체 회원",value:data.users,href:"/admin/users"},{label:"등록된 집",value:data.homes,href:"/admin/homes"},{label:"아파트 참여 회원",value:data.apartmentMembers,href:"/admin/apartment-members"},{label:"커뮤니티 게시글",value:data.posts,href:"/admin/posts"},{label:"장터 게시글",value:data.marketplacePosts,href:"/admin/marketplace"},{label:"미처리 신고",value:data.pendingReports,href:"/admin/reports?status=PENDING"},{label:"새 피드백",value:data.newFeedback,href:"/admin/feedback?status=NEW"}];return <main className={styles.page}><div className={styles.shell}><AdminHeader title="집갈피 운영 관리" description="서비스 현황과 신고·피드백 접수 내용을 확인합니다."/><section className={styles.stats} aria-label="서비스 현황">{cards.map(card=><Link className={styles.stat} href={card.href} key={card.href}><span>{card.label}</span><strong>{card.value.toLocaleString("ko-KR")}</strong></Link>)}</section></div></main>}
