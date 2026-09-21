import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteHomeButton } from "@/components/home/delete-home-button";
import { HomeForm } from "@/components/home/home-form";
import { authOptions } from "@/lib/auth/options";
import { getOwnedHome } from "@/lib/home/service";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "집 정보 수정 | 집갈피", robots: { index: false, follow: false } };

export default async function EditHomePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const home = await getOwnedHome(session.user.id, (await params).id);
  if (!home) notFound();
  return <main className={styles.page}><div className={styles.narrow}><Link className={styles.back} href="/dashboard">← Dashboard</Link><p className={styles.eyebrow}>EDIT HOME</p><h1>집 정보 수정</h1><HomeForm initialHome={home} /><DeleteHomeButton id={home.id} /></div></main>;
}
