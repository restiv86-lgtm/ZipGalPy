"use client";

import { useReducer, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductLabelCapture } from "./product-label-capture";
import { emptyLabelFields, type LabelFields } from "@/lib/product-label/extract";
import { labelFormReducer, type LabelProposal } from "@/lib/product-label/autofill";
import { ItemPhotoEditor, type ItemPhotoEditorHandle } from "./item-photo-editor";
import { AttachmentPanel } from "@/components/attachments/attachment-panel";
import photoStyles from "./item-photos.module.css";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { FormattedCurrencyInput, FormattedDateInput } from "@/components/ui/formatted-inputs";
import { formatDateForInput, parseCurrencyValue } from "@/lib/forms/format";

const categories = { APPLIANCE: "가전", FURNITURE: "가구", KITCHEN: "주방", HOUSEHOLD: "생활용품", DIGITAL: "디지털", HOBBY: "취미", CHILDCARE: "육아", OTHER: "기타" };
const statuses = { USING: "사용중", STORED: "보관중", REPAIRING: "수리중", SOLD: "판매완료", GIVEN_AWAY: "나눔완료", DISPOSED: "폐기" };
type Item = { id: string; name: string; category: string; brand: string | null; modelName: string | null; manufacturedAt?: Date | null; serialNumber?: string | null; purchaseDate: Date | null; purchasePrice: { toString(): string } | null; warrantyUntil: Date | null; memo: string | null; status: string };

export function HomeItemForm({ homeId, item, homes = [], requireHomeSelection = false }: { homeId: string; item?: Item; homes?: { id: string; name: string }[]; requireHomeSelection?: boolean }) {
  const router = useRouter();
  const initialHomeId = item ? homeId : homes.length === 1 ? homes[0].id : requireHomeSelection ? "" : homeId;
  const [selectedHomeId, setSelectedHomeId] = useState(initialHomeId);
  const [error, setError] = useState("");
  const [busy,setBusy]=useState(false);
  const photoEditor=useRef<ItemPhotoEditorHandle>(null);
  const [showLabel,setShowLabel]=useState(false);
  const [savedItem,setSavedItem]=useState<{id:string;homeId:string}|null>(null);
  const [labelForm,dispatchLabel]=useReducer(labelFormReducer,{fields:{...emptyLabelFields(),name:item?.name??"",brand:item?.brand??"",modelName:item?.modelName??"",serialNumber:item?.serialNumber??"",manufacturedAt:formatDateForInput(item?.manufacturedAt??null),category:item?.category??"APPLIANCE"},automatic:{},manual:{}});
  const fields=labelForm.fields;
  const editField=(key:keyof LabelFields,value:string)=>dispatchLabel({type:"edited",key,value});
  const discardLabel=()=>dispatchLabel({type:"discard"});
  function analyzedLabel(suggestions:Partial<Record<keyof LabelFields,LabelProposal>>){dispatchLabel({type:"analyzed",suggestions});}
  function confirmation(key:keyof LabelFields){return labelForm.automatic[key]?.confidence==="MEDIUM"?<small id={`${key}-label-check`} role="status">확인 필요 · 라벨과 비교하고 수정해 주세요.</small>:null;}

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy)return;
    if(savedItem){setBusy(true);try{await photoEditor.current?.save(savedItem.id);router.push(`/homes/${savedItem.homeId}/items/${savedItem.id}`);router.refresh();}catch{setError("물건 정보는 저장됐지만 사진 변경사항 일부가 반영되지 않았습니다. 사진 저장을 재시도하거나 저장된 물건으로 이동해 주세요.");}finally{setBusy(false);}return;}
    const form = new FormData(event.currentTarget);
    const targetHomeId = String(form.get("targetHomeId") ?? selectedHomeId);
    const requestHomeId = item ? homeId : targetHomeId;
    if (!requestHomeId) { setError("물건을 등록할 집을 선택해 주세요."); return; }
    setBusy(true);setError("");
    try {
    const body = { ...Object.fromEntries(form), targetHomeId, purchasePrice: parseCurrencyValue(String(form.get("purchasePrice") ?? "")), createExpense: form.get("createExpense") === "on" };
    const response = await fetch(`/api/homes/${requestHomeId}/items${item ? `/${item.id}` : ""}`, { method: item ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) { setError(data.message); return; }
    const saved={id:item?.id??data.item.id,homeId:data.item.homeId??requestHomeId};setSavedItem(saved);
    try{await photoEditor.current?.save(saved.id);}catch{setError("물건 정보는 저장됐지만 사진 변경사항 일부가 반영되지 않았습니다. 사진 저장을 재시도하거나 저장된 물건으로 이동해 주세요.");return;}
    router.push(`/homes/${data.item.homeId ?? requestHomeId}/items/${item?.id ?? data.item.id}`);
    router.refresh();
    } catch {setError("요청을 처리하지 못했습니다. 입력 내용을 확인하고 다시 시도해 주세요.");}
    finally {setBusy(false);}
  }

  return <form className={styles.form} onSubmit={submit}>
    <ItemPhotoEditor ref={photoEditor} itemId={item?.id} disabled={busy||!!savedItem}>
      <button type="button" className={photoStyles.labelToggle} disabled={busy||!!savedItem} aria-expanded={showLabel} onClick={()=>{if(showLabel)discardLabel();setShowLabel(!showLabel);}}><span>제품 라벨 촬영/분석</span><span aria-hidden="true">{showLabel?"−":"＋"}</span></button>
      <small className={photoStyles.labelHint}>HIGH/MEDIUM은 빈칸만 채웁니다. LOW는 후보로만 표시하며, 저장 전 모두 수정할 수 있어요.</small>
      {showLabel&&<ProductLabelCapture onAnalyzed={analyzedLabel} onDiscard={discardLabel} disabled={busy||!!savedItem}/>}
    </ItemPhotoEditor>
    {homes.length > 0 && <>
      <label htmlFor="targetHomeId">{item ? "물건이 있는 집" : "어느 집의 물건인가요? *"}</label>
      <select id="targetHomeId" name="targetHomeId" value={selectedHomeId} onChange={(event) => setSelectedHomeId(event.target.value)} required>
        {!item && requireHomeSelection && <option value="">집을 선택해 주세요</option>}
        {homes.map((home) => <option key={home.id} value={home.id}>{home.name}</option>)}
      </select>
      {item && <p className={styles.meta}>본인이 등록한 다른 집으로 이동할 수 있습니다. 연결된 수리·일정·비용·문서도 함께 이동합니다.</p>}
    </>}
    <label htmlFor="name">물건명 *</label><input id="name" name="name" value={fields.name} onChange={event=>editField("name",event.target.value)} aria-describedby={labelForm.automatic.name?.confidence==="MEDIUM"?"name-label-check":undefined} maxLength={120} required />{confirmation("name")}
    <div className={styles.two}>
      <div><label htmlFor="category">카테고리 *</label><select id="category" name="category" value={fields.category} onChange={event=>editField("category",event.target.value)}>{Object.entries(categories).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{confirmation("category")}</div>
      <div><label htmlFor="status">상태</label><select id="status" name="status" defaultValue={item?.status ?? "USING"}>{Object.entries(statuses).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
    </div>
    <div className={styles.two}>
      <div><label htmlFor="brand">브랜드 · 제조사</label><input id="brand" name="brand" value={fields.brand} onChange={event=>editField("brand",event.target.value)} aria-describedby={labelForm.automatic.brand?.confidence==="MEDIUM"?"brand-label-check":undefined} maxLength={80}/>{confirmation("brand")}</div>
      <div><label htmlFor="modelName">모델명</label><input id="modelName" name="modelName" value={fields.modelName} onChange={event=>editField("modelName",event.target.value)} aria-describedby={labelForm.automatic.modelName?.confidence==="MEDIUM"?"modelName-label-check":undefined} maxLength={120}/>{confirmation("modelName")}</div>
    </div>
    <div className={styles.two}>
      <div><label htmlFor="manufacturedAt">제조일자</label><FormattedDateInput id="manufacturedAt" name="manufacturedAt" aria-label="제조일자" value={fields.manufacturedAt} onValueChange={value=>editField("manufacturedAt",value)}/>{confirmation("manufacturedAt")}</div>
      <div><label htmlFor="serialNumber">시리얼번호</label><input id="serialNumber" name="serialNumber" value={fields.serialNumber} onChange={event=>editField("serialNumber",event.target.value)} aria-describedby={labelForm.automatic.serialNumber?.confidence==="MEDIUM"?"serialNumber-label-check":undefined} maxLength={120}/>{confirmation("serialNumber")}</div>
    </div>
    <div className={styles.two}>
      <div><label htmlFor="purchaseDate">구매일</label><FormattedDateInput id="purchaseDate" name="purchaseDate" aria-label="구매일" defaultValue={formatDateForInput(item?.purchaseDate ?? null)} /></div>
      <div><label htmlFor="purchasePrice">구매가격</label><FormattedCurrencyInput id="purchasePrice" name="purchasePrice" aria-label="구매가격" defaultValue={item?.purchasePrice?.toString() ?? ""} /></div>
    </div>
    {!item && <label style={{ display: "flex", alignItems: "center", gap: 9 }}><input name="createExpense" type="checkbox" style={{ width: 18, height: 18, margin: 0, padding: 0, flex: "0 0 auto", accentColor: "#087f72" }} /><span>구매비용에도 기록</span></label>}
    <label htmlFor="warrantyUntil">보증만료일</label><FormattedDateInput id="warrantyUntil" name="warrantyUntil" aria-label="보증만료일" defaultValue={formatDateForInput(item?.warrantyUntil ?? null)} />
    <label htmlFor="memo">개인 메모</label><textarea id="memo" name="memo" defaultValue={item?.memo ?? ""} />
    <p className={styles.meta}>구매가격과 개인 메모는 커뮤니티나 장터에 자동 공개되지 않습니다.</p>
    {item&&<AttachmentPanel target={{type:"item",id:item.id}} documentsOnly/>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={photoStyles.formActions}>
      <button type="submit" className={`${styles.primary} ${photoStyles.saveAction}`} disabled={busy}>{busy?"저장 중…":savedItem?"사진 저장 재시도":item ? "변경사항 저장" : "등록하기"}</button>
      {!savedItem&&(busy?<button type="button" className={`${styles.secondary} ${photoStyles.cancelAction}`} disabled>취소</button>:<Link className={`${styles.secondary} ${photoStyles.cancelAction}`} href={item?`/homes/${homeId}/items/${item.id}`:"/items"}>취소</Link>)}
    </div>
    {savedItem&&<Link className={styles.secondary} href={`/homes/${savedItem.homeId}/items/${savedItem.id}`}>저장된 물건 보기</Link>}
  </form>;
}
