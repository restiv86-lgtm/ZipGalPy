"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useState } from "react";
import type { AttachmentTarget } from "@/lib/attachments/access";
import styles from "./attachments.module.css";

type FileEntry = { id: string; fileName: string; mimeType: string; byteSize: number; purpose: string; contentUrl: string };
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "첨부파일 요청에 실패했습니다.");
  return data;
}
const purposes = { PHOTO: "사진", BEFORE: "수리 전", AFTER: "수리 후", RECEIPT: "영수증", WARRANTY: "보증서", QUOTE: "견적서", CONTRACT: "계약서", DOCUMENT: "문서", COVER: "대표사진" };

export function AttachmentPanel({ target, editable = true, sourceItemId, documentsOnly = false }: {
  target: AttachmentTarget; editable?: boolean; sourceItemId?: string | null; documentsOnly?: boolean;
}) {
  const inputId = useId();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [sources, setSources] = useState<FileEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [purpose, setPurpose] = useState(target.type === "home" ? "COVER" : "PHOTO");
  const { type, id } = target;
  const load = useCallback(async () => {
    const data = await api(`/api/attachments?type=${type}&id=${encodeURIComponent(id)}`);
    setFiles(data.files);
  }, [type, id]);
  useEffect(() => {
    let active = true;
    api(`/api/attachments?type=${type}&id=${encodeURIComponent(id)}`)
      .then(data => { if (active) setFiles(data.files); })
      .catch(error => { if (active) setMessage(error.message); });
    if (sourceItemId && editable) api(`/api/attachments?type=item&id=${encodeURIComponent(sourceItemId)}`)
      .then(data => { if (active) setSources(data.files.filter((file: FileEntry) => file.mimeType.startsWith("image/"))); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [type, id, editable, sourceItemId]);

  async function upload(file: File) {
    setBusy(true); setMessage("파일을 업로드하고 안전하게 확인하고 있습니다.");
    try {
      const authorization = await api("/api/attachments", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: { type, id }, fileName: file.name, mimeType: file.type, byteSize: file.size, purpose }) });
      // Browser sends bytes directly to the private store, not a Vercel Function or PostgreSQL.
      const uploaded = await fetch(authorization.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploaded.ok) throw new Error("파일 업로드에 실패했습니다. 다시 시도해 주세요.");
      await api("/api/attachments/finalize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assetId: authorization.assetId }) });
      await load(); setMessage("첨부했습니다.");
    } catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(file: FileEntry) {
    if (!confirm(`“${file.fileName}” 첨부를 삭제할까요?`)) return;
    setBusy(true);
    try { await api(`/api/attachments/${file.id}`, { method: "DELETE" }); await load(); setMessage("첨부를 삭제했습니다."); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  async function reuse(file: FileEntry) {
    setBusy(true);
    try { await api("/api/attachments/reuse", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId: file.id, marketplacePostId: id }) }); await load(); setMessage("선택한 사진만 장터에 연결했습니다."); }
    catch (error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <section className={styles.panel} aria-label="사진 및 파일 첨부">
    <h2>{documentsOnly ? "PDF 영수증 · 보증서" : type === "home" ? "대표사진" : "사진 · 첨부파일"}</h2>
    {documentsOnly&&<p>기존 PDF 첨부 기능입니다. PDF 추가·삭제는 즉시 반영됩니다. 사진 변경은 물건 저장 버튼으로 반영됩니다.</p>}
    <p>{type === "marketplace" ? "선택해 첨부한 사진만 이 아파트의 커뮤니티 참여 회원에게 표시됩니다." : "개인 첨부파일은 본인만 확인할 수 있습니다."}</p>
    <div className={styles.grid}>{files.filter(file=>!documentsOnly||file.mimeType==="application/pdf").map(file => <article className={styles.file} key={file.id}>
      <a href={file.contentUrl} target="_blank" rel="noopener noreferrer" aria-label={`${file.fileName} 열기`}>
        {file.mimeType.startsWith("image/") ? <Image src={file.contentUrl} alt={file.fileName} width={320} height={220} unoptimized /> : <span className={styles.pdf}>PDF 다운로드</span>}
        <strong>{file.fileName}</strong>
      </a><small>{purposes[file.purpose as keyof typeof purposes] ?? "첨부"} · {(file.byteSize / 1024 / 1024).toFixed(1)}MB</small>
      {editable && <button type="button" disabled={busy} onClick={() => remove(file)}>첨부 삭제</button>}
    </article>)}</div>
    {editable && <div className={styles.actions}>
      {type !== "home" && type !== "marketplace" && <label>첨부 용도<select value={purpose} onChange={event => setPurpose(event.target.value)} disabled={busy}>
        {Object.entries(purposes).filter(([key]) => key !== "COVER").map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select></label>}
      <label htmlFor={inputId}>파일 선택<input id={inputId} type="file" disabled={busy} accept={documentsOnly?".pdf":type === "home" || type === "marketplace" ? ".jpg,.jpeg,.png,.webp" : ".jpg,.jpeg,.png,.webp,.pdf"}
        onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ""; }} /></label>
      <small>JPG/PNG/WebP 최대 10MB{type !== "home" && type !== "marketplace" && " · PDF 최대 20MB"}. 민감한 개인정보가 포함된 사진은 장터에 공유하지 마세요.</small>
    </div>}
    {editable && sources.length > 0 && <div className={styles.sources}><h3>내 물건 사진에서 선택</h3>{sources.map(file => <button disabled={busy} type="button" key={file.id} onClick={() => reuse(file)}>{file.fileName} 장터에 사용</button>)}</div>}
    <p role="status" aria-live="polite">{message}</p>
  </section>;
}
