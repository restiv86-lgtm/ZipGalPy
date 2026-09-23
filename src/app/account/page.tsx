import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LogoutButton } from "@/components/auth/logout-button";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { authOptions } from "@/lib/auth/options";
import styles from "@/app/auth.module.css";

export const metadata: Metadata = {
  title: "내 계정 | 집갈피",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return <AuthShell eyebrow="MY ACCOUNT" title={`${session.user.name ?? "회원"}님, 반갑습니다`} description="집갈피 회원 인증이 정상적으로 연결되었습니다."><dl className={styles.account}><div><dt>이메일</dt><dd>{session.user.email}</dd></div><div><dt>인증 상태</dt><dd>로그인됨</dd></div></dl><LogoutButton /><DeleteAccountForm /></AuthShell>;
}
