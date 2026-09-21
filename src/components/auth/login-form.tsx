"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "@/app/auth.module.css";
import { POST_LOGIN_PATH } from "@/lib/auth/constants";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const registered = searchParams.get("registered") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });

    setPending(false);
    if (!result?.ok) {
      setError("이메일 또는 비밀번호를 확인해 주세요.");
      return;
    }

    router.push(searchParams.get("next") === "/onboarding" ? "/onboarding" : POST_LOGIN_PATH);
    router.refresh();
  }

  return (
    <>
      {registered && <p className={styles.success} role="status">회원가입이 완료되었습니다. 로그인해 주세요.</p>}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={pending}>{pending ? "로그인 중…" : "로그인"}</button>
      </form>
      <p className={styles.switch}>아직 계정이 없으신가요? <Link href="/signup">회원가입</Link></p>
    </>
  );
}
