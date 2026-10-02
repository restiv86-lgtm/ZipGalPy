import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { derivedContractStatus, listContracts } from "@/lib/home-contract/service";
import styles from "../items/items.module.css";

const types={LEASE:"임대·전세",RENTAL:"렌탈",INSURANCE:"보험",INTERNET:"인터넷",SECURITY:"보안",MAINTENANCE:"유지관리",SUBSCRIPTION:"구독",OTHER:"기타"};const statuses={ACTIVE:"사용 중",EXPIRING:"만료 예정",EXPIRED:"만료",TERMINATED:"종료"};
export default async function ContractsPage({params}:PageProps<"/homes/[homeId]/contracts">){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");const{homeId}=await params;const data=await listContracts(session.user.id,homeId);if(!data)notFound();return <main className={styles.page}><div className={styles.shell}><ManagementPageHeader title="계약" description="렌탈·보험·인터넷·주거 계약과 만료일을 관리하세요." actionHref={`/homes/${homeId}/contracts/new`} actionLabel="계약 등록"/>{data.contracts.length?<div className={styles.grid}>{data.contracts.map(contract=>{const state=derivedContractStatus(contract);return <Link className={styles.card} href={`/homes/${homeId}/contracts/${contract.id}/edit`} key={contract.id}><span className={styles.badge}>{types[contract.type]}</span><h2>{contract.title}</h2><span className={styles.meta}>{contract.endDate?`${contract.endDate.toLocaleDateString("ko-KR")} 만료`:"종료일 미입력"}</span><strong>{statuses[state]}</strong></Link>})}</div>:<ManagementEmptyState icon="📝" title="아직 등록된 계약이 없습니다." description="주거·렌탈·보험 계약의 중요한 날짜를 관리해보세요." actionHref={`/homes/${homeId}/contracts/new`} actionLabel="첫 계약 등록"/>}</div></main>}
