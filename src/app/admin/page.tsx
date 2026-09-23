import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {ReportActions} from "@/components/admin/report-actions";
import {getAdminDashboard} from "@/lib/admin/service";
import {getAdminUser} from "@/lib/admin/security";
import styles from "./admin.module.css";
export const metadata:Metadata={title:"운영 관리 | 집갈피",robots:{index:false,follow:false}};
const reasons={SPAM_AD:"스팸/광고",ABUSE:"욕설/비방",INAPPROPRIATE:"부적절한 콘텐츠",SUSPECTED_FRAUD:"사기 의심",OTHER:"기타"}as const;
export default async function AdminPage(){const admin=await getAdminUser();if(!admin)notFound();const data=await getAdminDashboard(),stats=[["전체 회원",data.counts.users],["Home",data.counts.homes],["아파트 참여 회원",data.counts.apartmentMembers],["게시글",data.counts.posts],["장터 게시글",data.counts.marketplacePosts],["미처리 신고",data.counts.pendingReports]]as const;return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href="/dashboard">← Dashboard</Link><h1>집갈피 운영 관리</h1><section className={styles.stats} aria-label="서비스 현황">{stats.map(([label,value])=><article className={styles.stat} key={label}><span>{label}</span><strong>{value.toLocaleString("ko-KR")}</strong></article>)}</section><section className={styles.reports}><h2>신고 관리</h2>{data.reports.length===0?<p>접수된 신고가 없습니다.</p>:data.reports.map(report=><article className={styles.report} key={report.id}><header><strong>{reasons[report.reason]} · {report.post?`게시글: ${report.post.title}`:report.comment?`댓글: ${report.comment.content}`:"삭제된 콘텐츠"}</strong><time>{report.createdAt.toLocaleString("ko-KR")}</time></header><p>신고자: {report.reporterMember?.user.nickname??"탈퇴한 사용자"}</p>{report.detail&&<p>{report.detail}</p>}<ReportActions reportId={report.id} initialStatus={report.status} initialMemo={report.adminMemo??""}/></article>)}</section></div></main>}
