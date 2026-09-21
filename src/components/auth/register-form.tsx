"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "@/app/auth.module.css";

type FieldErrors = Partial<Record<"email" | "password" | "passwordConfirm" | "nickname" | "termsAgreed" | "privacyAgreed", string[]>>;

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
        nickname: formData.get("nickname"),
        termsAgreed: formData.get("termsAgreed") === "on",
        privacyAgreed: formData.get("privacyAgreed") === "on",
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
        <label htmlFor="nickname">닉네임</label>
        <input id="nickname" name="nickname" autoComplete="nickname" minLength={2} maxLength={30} required aria-describedby={fieldError("nickname") ? "nickname-error" : undefined} />
        {fieldError("nickname") && <p id="nickname-error" className={styles.fieldError}>{fieldError("nickname")}</p>}

        <label htmlFor="email">이메일</label>
        <input id="email" name="email" type="email" autoComplete="email" required aria-describedby={fieldError("email") ? "email-error" : undefined} />
        {fieldError("email") && <p id="email-error" className={styles.fieldError}>{fieldError("email")}</p>}

        <label htmlFor="password">비밀번호</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={72} required aria-describedby="password-help" />
        <p id="password-help" className={styles.help}>{fieldError("password") ?? "영문·숫자·특수문자를 포함해 10자 이상 입력해 주세요."}</p>

        <label htmlFor="passwordConfirm">비밀번호 확인</label>
        <input id="passwordConfirm" name="passwordConfirm" type="password" autoComplete="new-password" required aria-describedby={fieldError("passwordConfirm") ? "password-confirm-error" : undefined} />
        {fieldError("passwordConfirm") && <p id="password-confirm-error" className={styles.fieldError}>{fieldError("passwordConfirm")}</p>}

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, margin: 0, lineHeight: 1.5 }}><input name="termsAgreed" type="checkbox" required style={{ width: 18, height: 18, marginTop: 2, padding: 0, flex: "0 0 auto" }} /> <span>서비스 이용약관에 동의합니다. (필수)</span></label>
          {fieldError("termsAgreed") && <p className={styles.fieldError}>{fieldError("termsAgreed")}</p>}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, margin: 0, lineHeight: 1.5 }}><input name="privacyAgreed" type="checkbox" required style={{ width: 18, height: 18, marginTop: 2, padding: 0, flex: "0 0 auto" }} /> <span>개인정보 처리방침에 동의합니다. (필수)</span></label>
          {fieldError("privacyAgreed") && <p className={styles.fieldError}>{fieldError("privacyAgreed")}</p>}
        </div>

        {message && <p className={styles.error} role="alert">{message}</p>}
        <button type="submit" disabled={pending}>{pending ? "가입 처리 중…" : "회원가입"}</button>
      </form>
      <p className={styles.switch}>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
    </>
  );
}
