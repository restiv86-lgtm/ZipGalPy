import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteHomeButton } from "@/components/home/delete-home-button";
import { HomeForm } from "@/components/home/home-form";
import { HomeManagementNav } from "@/components/home/home-management-nav";
import { authOptions } from "@/lib/auth/options";
import { getOwnedHome, listHomes } from "@/lib/home/service";
import styles from "@/app/dashboard/dashboard.module.css";

export const metadata: Metadata = { title: "집 정보 수정 | 집갈피", robots: { index: false, follow: false } };

export default async function EditHomePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  const id = (await params).id;
  const [home, homes] = await Promise.all([getOwnedHome(session.user.id, id), listHomes(session.user.id)]);
  if (!home) notFound();
  return <main className={styles.page}><HomeManagementNav homeId={home.id} homeName={home.name} current="집 정보 수정" homes={homes.map(({id,name})=>({id,name}))}/><div className={styles.narrow}>{homes.length>1&&<nav className={styles.homeTabs} aria-label="수정할 집 선택">{homes.map(candidate=><Link className={candidate.id===home.id?styles.homeTabActive:undefined} href={`/home/${candidate.id}/edit`} key={candidate.id}>🏠 {candidate.name}</Link>)}</nav>}<p className={styles.eyebrow}>EDIT HOME</p><h1>집 정보 수정</h1><p className={styles.lead}>등록한 주거공간의 기본 정보를 변경할 수 있습니다.</p><HomeForm initialHome={home} /><DeleteHomeButton id={home.id} /></div></main>;
}
