import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocumentDeleteButton } from "@/components/home-document/document-delete-button";
import { DocumentForm } from "@/components/home-document/document-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedDocument } from "@/lib/home-document/service";
import { listRecordHomeOptions } from "@/lib/home/record-options";
import styles from "@/app/homes/[homeId]/items/items.module.css";
export default async function EditDocumentPage({ params }: PageProps<"/homes/[homeId]/documents/[documentId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, documentId } = await params; const [document, homes] = await Promise.all([getOwnedDocument(session.user.id, homeId, documentId), listRecordHomeOptions(session.user.id)]); if (!document) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/documents/${documentId}`}>← 문서 상세</Link><div className={styles.heading}><h1>문서 수정</h1><DocumentDeleteButton homeId={homeId} documentId={documentId} /></div><DocumentForm homeId={homeId} homes={homes} document={document} /></div></main>; }
