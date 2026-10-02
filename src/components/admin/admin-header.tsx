import Link from "next/link";
import {PageHeader} from "@/components/ui/page-primitives";
import styles from "@/app/admin/admin.module.css";
export function AdminHeader({title,description}:{title:string;description?:string}){return <><div className={styles.top}><Link href="/admin">← 관리자 Dashboard</Link><Link href="/dashboard">사용자 Dashboard</Link></div><PageHeader eyebrow="OPERATIONS" title={title} description={description}/><nav className={styles.nav} aria-label="관리자 메뉴"><Link href="/admin/users">회원</Link><Link href="/admin/homes">Home</Link><Link href="/admin/apartment-members">아파트 참여</Link><Link href="/admin/posts">게시글</Link><Link href="/admin/marketplace">장터</Link><Link href="/admin/reports">신고</Link><Link href="/admin/feedback">피드백</Link></nav></>}
