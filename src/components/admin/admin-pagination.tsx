import Link from "next/link";
import {ADMIN_PAGE_SIZE} from "@/lib/admin/service";
import styles from "@/app/admin/admin.module.css";
export function AdminPagination({page,total,params={}}:{page:number;total:number;params?:Record<string,string|undefined>}){const pages=Math.max(1,Math.ceil(total/ADMIN_PAGE_SIZE));function href(next:number){const s=new URLSearchParams();for(const[k,v]of Object.entries(params))if(v)s.set(k,v);s.set("page",String(next));return`?${s.toString()}`}return <nav className={styles.pagination} aria-label="페이지 이동"><Link aria-disabled={page<=1} href={page<=1?href(1):href(page-1)}>이전</Link><span>{page} / {pages} · 총 {total.toLocaleString("ko-KR")}건</span><Link aria-disabled={page>=pages} href={page>=pages?href(pages):href(page+1)}>다음</Link></nav>}
