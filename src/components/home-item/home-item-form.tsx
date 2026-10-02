"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/homes/[homeId]/items/items.module.css";
import { HomeSwitcher } from "@/components/home/home-switcher";
const categories = {
  APPLIANCE: "가전",
  FURNITURE: "가구",
  KITCHEN: "주방",
  HOUSEHOLD: "생활용품",
  DIGITAL: "디지털",
  HOBBY: "취미",
  CHILDCARE: "육아",
  OTHER: "기타",
};
const statuses = {
  USING: "사용중",
  STORED: "보관중",
  REPAIRING: "수리중",
  SOLD: "판매완료",
  GIVEN_AWAY: "나눔완료",
  DISPOSED: "폐기",
};
type Item = {
  id: string;
  name: string;
  category: string;
  brand: string | null;
  modelName: string | null;
  purchaseDate: Date | null;
  purchasePrice: { toString(): string } | null;
  warrantyUntil: Date | null;
  memo: string | null;
  status: string;
};
function formatDateValue(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

function formatDateInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = formatDateValue(event.currentTarget.value);
}

function formatPriceValue(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

function formatPriceInput(event: React.FormEvent<HTMLInputElement>) {
  event.currentTarget.value = formatPriceValue(event.currentTarget.value);
}

export function HomeItemForm({
  homeId,
  item,
  homes = [],
}: {
  homeId: string;
  item?: Item;
  homes?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      ...Object.fromEntries(form),
      purchasePrice: String(form.get("purchasePrice") ?? "").replaceAll(",", ""),
      createExpense: form.get("createExpense") === "on",
    };
    const response = await fetch(
      `/api/homes/${homeId}/items${item ? `/${item.id}` : ""}`,
      {
        method: item ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError(data.message);
      return;
    }
    router.push(
      `/homes/${data.item.homeId ?? homeId}/items/${item?.id ?? data.item.id}`,
    );
    router.refresh();
  }
  const date = (value: Date | null) =>
    value ? new Date(value).toISOString().slice(0, 10) : "";
  return (
    <form className={styles.form} onSubmit={submit}>
      {!item && <HomeSwitcher currentHomeId={homeId} homes={homes} />}
      {item && homes.length > 0 && (
        <>
          <label htmlFor="targetHomeId">물건이 있는 주거공간</label>
          <select id="targetHomeId" name="targetHomeId" defaultValue={homeId}>
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.name}
              </option>
            ))}
          </select>
        </>
      )}
      <label htmlFor="name">물건명 *</label>
      <input
        id="name"
        name="name"
        defaultValue={item?.name}
        maxLength={120}
        required
      />
      <div className={styles.two}>
        <div>
          <label htmlFor="category">카테고리 *</label>
          <select
            id="category"
            name="category"
            defaultValue={item?.category ?? "APPLIANCE"}
          >
            {Object.entries(categories).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status">상태</label>
          <select
            id="status"
            name="status"
            defaultValue={item?.status ?? "USING"}
          >
            {Object.entries(statuses).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.two}>
        <div>
          <label htmlFor="brand">브랜드</label>
          <input id="brand" name="brand" defaultValue={item?.brand ?? ""} />
        </div>
        <div>
          <label htmlFor="modelName">모델명</label>
          <input
            id="modelName"
            name="modelName"
            defaultValue={item?.modelName ?? ""}
          />
        </div>
      </div>
      <div className={styles.two}>
        <div>
          <label htmlFor="purchaseDate">구매일</label>
          <input
            id="purchaseDate"
            name="purchaseDate"
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            pattern="\d{4}-\d{2}-\d{2}"
            onInput={formatDateInput}
            defaultValue={date(item?.purchaseDate ?? null)}
          />
        </div>
        <div>
          <label htmlFor="purchasePrice">구매가격</label>
          <input
            id="purchasePrice"
            name="purchasePrice"
            type="text"
            inputMode="numeric"
            onInput={formatPriceInput}
            defaultValue={formatPriceValue(item?.purchasePrice?.toString() ?? "")}
          />
        </div>
      </div>
      {!item && (
        <label style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <input
            name="createExpense"
            type="checkbox"
            style={{
              width: 18,
              height: 18,
              margin: 0,
              padding: 0,
              flex: "0 0 auto",
              accentColor: "#087f72",
            }}
          />
          <span>구매비용에도 기록</span>
        </label>
      )}
      <label htmlFor="warrantyUntil">보증만료일</label>
      <input
        id="warrantyUntil"
        name="warrantyUntil"
        type="text"
        inputMode="numeric"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        pattern="\d{4}-\d{2}-\d{2}"
        onInput={formatDateInput}
        defaultValue={date(item?.warrantyUntil ?? null)}
      />
      <label htmlFor="memo">개인 메모</label>
      <textarea id="memo" name="memo" defaultValue={item?.memo ?? ""} />
      <p className={styles.meta}>
        구매가격과 개인 메모는 커뮤니티나 장터에 자동 공개되지 않습니다.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.primary}>
        {item ? "수정 완료" : "물건 등록"}
      </button>
    </form>
  );
}
