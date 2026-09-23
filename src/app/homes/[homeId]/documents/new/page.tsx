import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocumentForm } from "@/components/home-document/document-form";
import { authOptions } from "@/lib/auth/options";
import { listDocuments } from "@/lib/home-document/service";
import styles from "../../items/items.module.css";
export default async function NewDocumentPage({ params }: PageProps<"/homes/[homeId]/documents/new">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId } = await params, data = await listDocuments(session.user.id, homeId); if (!data) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/documents`}>← 문서 목록</Link><div className={styles.heading}><div><p className={styles.eyebrow}>{data.home.name}</p><h1>문서 등록</h1></div></div><DocumentForm homeId={homeId} items={data.items} contracts={data.contracts}/></div></main>; }
