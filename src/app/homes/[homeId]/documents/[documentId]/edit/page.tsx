import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DocumentDeleteButton } from "@/components/home-document/document-delete-button";
import { DocumentForm } from "@/components/home-document/document-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedDocument, listDocuments } from "@/lib/home-document/service";
import styles from "../../../items/items.module.css";
export default async function EditDocumentPage({ params }: PageProps<"/homes/[homeId]/documents/[documentId]/edit">) { const session = await getServerSession(authOptions); if (!session?.user?.id) redirect("/login"); const { homeId, documentId } = await params; const [document, data] = await Promise.all([getOwnedDocument(session.user.id, homeId, documentId), listDocuments(session.user.id, homeId)]); if (!document || !data) notFound(); return <main className={styles.page}><div className={styles.shell}><Link className={styles.back} href={`/homes/${homeId}/documents/${documentId}`}>← 문서 상세</Link><div className={styles.heading}><h1>문서 수정</h1><DocumentDeleteButton homeId={homeId} documentId={documentId}/></div><DocumentForm homeId={homeId} items={data.items} contracts={data.contracts} document={document}/></div></main>; }
