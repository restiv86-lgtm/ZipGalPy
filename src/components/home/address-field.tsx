export function AddressField({ defaultValue = "", error }: { defaultValue?: string; error?: string }) {
  return (
    <div>
      <label htmlFor="address">주소</label>
      <div style={{ display: "flex", gap: 8 }}>
        <input id="address" name="address" defaultValue={defaultValue} maxLength={200} required aria-describedby={error ? "address-error" : "address-help"} />
        <button type="button" disabled aria-label="주소 검색 기능 준비 중" title="주소 검색 기능 준비 중">주소 검색</button>
      </div>
      <p id={error ? "address-error" : "address-help"}>{error ?? "현재는 주소를 직접 입력해 주세요. 주소 검색 API를 연결할 예정입니다."}</p>
    </div>
  );
}
