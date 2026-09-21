import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "회원가입 | 집갈피",
  description: "집갈피 계정을 만들고 내 집 정보를 관리할 준비를 시작하세요.",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return <AuthShell eyebrow="CREATE ACCOUNT" title="집갈피 시작하기" description="하나의 계정으로 웹과 앱에서 같은 집 정보를 관리할 수 있습니다."><RegisterForm /></AuthShell>;
}
