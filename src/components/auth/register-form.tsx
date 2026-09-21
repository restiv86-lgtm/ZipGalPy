"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "@/app/auth.module.css";

type FieldErrors = Partial<Record<"email" | "password" | "passwordConfirm" | "name", string[]>>;

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrors({});
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
        passwordConfirm: formData.get("passwordConfirm"),
        name: formData.get("name"),
      }),
    });
    const result = await response.json();
    setPending(false);

    if (!response.ok) {
      setMessage(result.message ?? "입력 내용을 확인해 주세요.");
      setErrors(result.errors ?? {});
      return;
    }

    router.push("/login?registered=1");
  }

  const fieldError = (name: keyof FieldErrors) => errors[name]?.[0];

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">이름 또는 닉네임</label>
        <input id="name" name="name" autoComplete="name" minLength={2} maxLength={30} required aria-describedby={fieldError("name") ? "name-error" : undefined} />
        {fieldError("name") && <p id="name-error" className={styles.fieldError}>{fieldError("name")}</p>}

        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required aria-describedby={fieldError("email") ? "email-error" : undefined} />
        {fieldError("email") && <p id="email-error" className={styles.fieldError}>{fieldError("email")}</p>}

        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required aria-describedby="password-help" />
        <p id="password-help" className={styles.help}>{fieldError("password") ?? "영문·숫자·특수문자를 포함해 10자 이상 입력해 주세요."}</p>

        <label htmlFor="passwordConfirm">비밀번호 확인</label>
        <input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required aria-describedby={fieldError("passwordConfirm") ? "password-confirm-error" : undefined} />
        {fieldError("passwordConfirm") && <p id="password-confirm-error" className={styles.fieldError}>{fieldError("passwordConfirm")}</p>}

        {message && <p className={styles.error} role="alert">{message}</p>}
        <button type="submit" disabled={pending}>{pending ? "가입 처리 중…" : "회원가입"}</button>
      </form>
      <p className={styles.switch}>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
    </>
  );
}
