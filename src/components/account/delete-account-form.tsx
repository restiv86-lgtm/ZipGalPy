"use client";
import { signOut } from "next-auth/react";
import { useState } from "react";
import styles from "./delete-account-form.module.css";

export function DeleteAccountForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirm("계정과 개인 집관리 데이터를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError("");
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: form.get("password"), confirmation: form.get("confirmation"), understood: form.get("understood") === "on" }) });
    const data = await response.json();
    if (!response.ok) { setError(data.message ?? "탈퇴를 처리하지 못했습니다."); setPending(false); return; }
    await signOut({ callbackUrl: "/" });
  }
  return <section className={styles.dangerZone} aria-labelledby="delete-account-title"><h2 id="delete-account-title">회원 탈퇴</h2><p>탈퇴하면 내 집과 물건·수리·일정·비용·계약·문서 등 개인 데이터는 삭제되며 복구할 수 없습니다.</p><p>게시글·댓글·장터 글과 신고 기록은 커뮤니티의 대화 및 운영 기록을 위해 작성자 정보가 제거된 채 보존될 수 있습니다. 본문에 직접 작성한 개인정보는 자동으로 지워지지 않으므로 탈퇴 전에 해당 게시글을 개별 삭제해 주세요.</p><form className={styles.form} onSubmit={submit}><label htmlFor="delete-password">현재 비밀번호</label><input id="delete-password" name="password" type="password" autoComplete="current-password" required/><label className={styles.check}><input name="understood" type="checkbox" required/> 위 내용을 확인했으며 삭제된 개인 데이터는 복구할 수 없음을 이해했습니다.</label><label htmlFor="delete-confirmation">확인을 위해 ‘회원 탈퇴’를 입력해 주세요.</label><input id="delete-confirmation" name="confirmation" required pattern="회원 탈퇴"/><button className={styles.dangerButton} disabled={pending}>{pending ? "처리 중…" : "회원 탈퇴"}</button>{error && <p className={styles.error} role="alert">{error}</p>}</form></section>;
}
