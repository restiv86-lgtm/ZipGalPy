import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ManagementEmptyState } from "@/components/home/management-empty-state";
import { ManagementPageHeader } from "@/components/home/management-page-header";
import { authOptions } from "@/lib/auth/options";
import { listExpenses } from "@/lib/home-expense/service";
import styles from "../items/items.module.css";

const labels={PURCHASE:"구매",REPAIR:"수리",MAINTENANCE:"유지관리",MANAGEMENT:"관리비",UTILITY:"공과금",CONTRACT:"계약관련",INSURANCE:"보험",TAX:"세금",OTHER:"기타"};

export default async function ExpensesPage({params,searchParams}:PageProps<"/homes/[homeId]/expenses">){
  const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login");
  const{homeId}=await params;const query=await searchParams;const period=query.period==="year"||query.period==="all"?query.period:"month";
  const data=await listExpenses(session.user.id,homeId,period);if(!data)notFound();
  return <main className={styles.page}><div className={styles.shell}>
    <ManagementPageHeader title="비용" description="우리 집과 관련된 구매·수리·관리 지출을 확인하세요." actionHref={`/homes/${homeId}/expenses/new`} actionLabel="비용 등록"/>
    <nav className={styles.actions} aria-label="비용 기간"><Link className={period==="month"?styles.primary:styles.secondary} href="?period=month">이번 달</Link><Link className={period==="year"?styles.primary:styles.secondary} href="?period=year">올해</Link><Link className={period==="all"?styles.primary:styles.secondary} href="?period=all">전체</Link></nav>
    <section className={styles.detail}><p className={styles.meta}>선택 기간 총 지출</p><h2>{data.total.toLocaleString("ko-KR")}원</h2>{data.summary.length?<div className={styles.grid}>{data.summary.map(row=><div className={styles.card} key={row.category}><span className={styles.badge}>{labels[row.category]}</span><strong>{Number(row.amount).toLocaleString("ko-KR")}원</strong></div>)}</div>:null}</section>
    {data.expenses.length?<div className={styles.grid}>{data.expenses.map(expense=><Link className={styles.card} href={`/homes/${homeId}/expenses/${expense.id}/edit`} key={expense.id}><span className={styles.badge}>{labels[expense.category]}</span><h2>{expense.title}</h2><strong>{Number(expense.amount).toLocaleString("ko-KR")}원</strong><span className={styles.meta}>{expense.expenseDate.toLocaleDateString("ko-KR")}{expense.homeItem?` · ${expense.homeItem.name}`:""}</span></Link>)}</div>:<ManagementEmptyState icon="💰" title="선택한 기간의 비용 기록이 없습니다." description="집과 관련된 지출을 기록해보세요." actionHref={`/homes/${homeId}/expenses/new`} actionLabel="첫 비용 등록"/>}
  </div></main>;
}
