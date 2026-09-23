"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "@/app/auth.module.css";
import { signupAgreements } from "@/data/signup-agreements";

type AgreementName = (typeof signupAgreements)[number]["name"];
type FieldErrors = Partial<Record<"name" | "email" | "password" | "passwordConfirm" | "nickname" | AgreementName, string[]>>;

export function RegisterForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [agreements, setAgreements] = useState<Record<AgreementName, boolean>>({ termsAgreed: false, privacyAgreed: false, marketingAgreed: false });

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
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        passwordConfirm: formData.get("passwordConfirm"),
        nickname: formData.get("nickname"),
        ...agreements,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setPending(false);
      setMessage(result.message ?? "입력 내용을 확인해 주세요.");
      setErrors(result.errors ?? {});
      return;
    }

    const login = await signIn("credentials", { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? ""), redirect: false });
    setPending(false);
    router.push(login?.ok ? "/onboarding" : "/login?registered=1&next=/onboarding");
    router.refresh();
  }

  const fieldError = (name: keyof FieldErrors) => errors[name]?.[0];

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label htmlFor="name">이름</label>
        <input id="name" name="name" autoComplete="name" minLength={2} maxLength={50} required aria-describedby={fieldError("name") ? "name-error" : undefined} />
        {fieldError("name") && <p id="name-error" className={styles.fieldError}>{fieldError("name")}</p>}

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

        <div style={{ display: "grid", gap: 9, marginTop: 14, paddingTop: 14, borderTop: "1px solid #e5efed" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 9, margin: 0, fontWeight: 800 }}><input type="checkbox" checked={signupAgreements.every(({ name }) => agreements[name])} onChange={(event) => setAgreements({ termsAgreed: event.target.checked, privacyAgreed: event.target.checked, marketingAgreed: event.target.checked })} style={{ width: 18, height: 18, padding: 0 }} /> <span>전체 동의</span></label>
          {signupAgreements.map((agreement) => <div key={agreement.name} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "start" }}><label style={{ display: "flex", alignItems: "flex-start", gap: 9, margin: 0, lineHeight: 1.5 }}><input name={agreement.name} type="checkbox" checked={agreements[agreement.name]} required={agreement.required} onChange={(event) => setAgreements((current) => ({ ...current, [agreement.name]: event.target.checked }))} style={{ width: 18, height: 18, marginTop: 2, padding: 0, flex: "0 0 auto" }} /> <span>{agreement.label} ({agreement.required ? "필수" : "선택"})</span></label><Link href={agreement.futurePath} target="_blank" style={{ color: "#087f72", fontSize: 13, fontWeight: 750 }}>전문 보기</Link>{fieldError(agreement.name) && <p className={styles.fieldError} style={{ gridColumn: "1 / -1" }}>{fieldError(agreement.name)}</p>}</div>)}
        </div>

        {message && <p className={styles.error} role="alert">{message}</p>}
        <button type="submit" disabled={pending}>{pending ? "가입 처리 중…" : "회원가입"}</button>
      </form>
      <p className={styles.switch}>이미 계정이 있으신가요? <Link href="/login">로그인</Link></p>
    </>
  );
}
