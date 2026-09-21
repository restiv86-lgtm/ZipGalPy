import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "로그인 | 집갈피",
  description: "집갈피 계정에 로그인합니다.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthShell eyebrow="WELCOME BACK" title="집갈피 로그인" description="내 집의 기록을 안전하게 이어서 관리하세요."><Suspense><LoginForm /></Suspense></AuthShell>;
}
