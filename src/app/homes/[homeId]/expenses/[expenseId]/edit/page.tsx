import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExpenseDeleteButton } from "@/components/home-expense/expense-delete-button";
import { ExpenseForm } from "@/components/home-expense/expense-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedExpense } from "@/lib/home-expense/service";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export default async function EditExpense({ params }: PageProps<"/homes/[homeId]/expenses/[expenseId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, expenseId } = await params; const [expense, homes] = await Promise.all([getOwnedExpense(session.user.id, homeId, expenseId), listRecordHomeOptions(session.user.id)]); if (!expense) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/expenses/${expenseId}`}>← 비용 상세</Link><div className={styles.heading}><h1>비용 수정</h1><ExpenseDeleteButton homeId={homeId} expenseId={expenseId} /></div><ExpenseForm homeId={homeId} homes={homes} expense={expense} /></div></main>; }
