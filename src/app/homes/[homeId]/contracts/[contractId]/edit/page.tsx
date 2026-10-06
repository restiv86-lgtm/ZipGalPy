import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ContractDeleteButton } from "@/components/home-contract/contract-delete-button";
import { ContractForm } from "@/components/home-contract/contract-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedContract } from "@/lib/home-contract/service";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export default async function EditContract({ params }: PageProps<"/homes/[homeId]/contracts/[contractId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, contractId } = await params; const [contract, homes] = await Promise.all([getOwnedContract(session.user.id, homeId, contractId), listRecordHomeOptions(session.user.id)]); if (!contract) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/contracts/${contractId}`}>← 계약 상세</Link><div className={styles.heading}><h1>계약 수정</h1><ContractDeleteButton homeId={homeId} contractId={contractId} /></div><ContractForm homeId={homeId} homes={homes} contract={contract} /></div></main>; }
