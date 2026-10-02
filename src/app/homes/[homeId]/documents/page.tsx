import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { derivedDocumentStatus, listDocuments } from "@/lib/home-document/service";
import styles from "../items/items.module.css";

const types={CONTRACT:"계약서",WARRANTY:"보증서",RECEIPT:"영수증",MANUAL:"설명서",INSURANCE:"보험",TAX:"세금",CERTIFICATE:"증명서",OTHER:"기타"};const statuses={ACTIVE:"보관 중",EXPIRED:"만료",ARCHIVED:"보관 종료"};
export default async function DocumentsPage({params}:PageProps<"/homes/[homeId]/documents">){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listDocuments(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><ManagementPageHeader title="문서" description="계약서·보증서·영수증 등의 정보를 관리하세요." actionHref={`/homes/${homeId}/documents/new`} actionLabel="문서 등록"/>{data.documents.length?<div className={styles.grid}>{data.documents.map(document=>{const state=derivedDocumentStatus(document);return <Link className={styles.card} href={`/homes/${homeId}/documents/${document.id}`} key={document.id}><span className={styles.badge}>{types[document.type]}</span><h2>{document.title}</h2><span className={styles.meta}>{document.expiresAt?`${document.expiresAt.toLocaleDateString("ko-KR")} 만료`:"만료일 미입력"}</span><strong>{statuses[state]}</strong></Link>})}</div>:<ManagementEmptyState icon="📄" title="아직 보관된 문서가 없습니다." description="계약서와 보증서의 정보를 기록해보세요." actionHref={`/homes/${homeId}/documents/new`} actionLabel="첫 문서 등록"/>}</div></main>}
