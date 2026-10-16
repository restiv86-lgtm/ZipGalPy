export function formatCurrencyInput(value: string | number | null | undefined) {
  const raw=parseCurrencyValue(String(value??""));
  if(!/^\d*$/.test(raw))return raw;
  const digits = raw.replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseCurrencyValue(value: string | null | undefined) {
  return String(value ?? "").normalize("NFKC").replace(/[,\s₩원]/g, "");
}

export function formatDateInput(value: string | null | undefined) {
  const digits = String(value ?? "").normalize("NFKC").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function formatDateForInput(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

export function formatDateTimeForInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function isCompleteDate(value: string) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split("-").map(Number);
  if(year<1||month<1||month>12||day<1)return false;
  const leap=year%4===0&&(year%100!==0||year%400===0);
  return day<=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][month-1];
}

export function currencyInputError(value:string,min=0,max=99_999_999_999_999){
  const raw=parseCurrencyValue(value);if(!raw)return "";
  if(!/^\d+$/.test(raw)||!Number.isSafeInteger(Number(raw)))return "금액은 0 이상의 정수로 입력해 주세요.";
  if(Number(raw)<min||Number(raw)>max)return `${min.toLocaleString("ko-KR")}원 이상 ${max.toLocaleString("ko-KR")}원 이하로 입력해 주세요.`;
  return "";
}
export type NumericFormat="date"|"currency";
export function formatNumericEdit(raw:string,caret:number,kind:NumericFormat){
  const value=kind==="date"?formatDateInput(raw):formatCurrencyInput(raw);
  if(kind==="currency"&&!/^\d*$/.test(parseCurrencyValue(raw)))return{value,caret:Math.min(caret,value.length)};
  const before=raw.slice(0,caret).normalize("NFKC").replace(/\D/g,"").length;
  const removed=kind==="currency"?Math.max(0,raw.replace(/\D/g,"").length-value.replace(/\D/g,"").length):0;
  const target=Math.max(0,before-removed);let position=0,count=0;
  while(position<value.length&&count<target){if(/\d/.test(value[position]))count++;position++;}
  return{value,caret:position};
}
export function deleteFormatSeparator(value:string,start:number,end:number,key:string,kind:NumericFormat){
  if(start!==end)return null;
  const separator=kind==="date"?"-":",";
  if(key==="Backspace"&&start>1&&value[start-1]===separator){const at=start-2;return formatNumericEdit(value.slice(0,at)+value.slice(start),at,kind);}
  if(key==="Delete"&&value[start]===separator&&start+1<value.length)return formatNumericEdit(value.slice(0,start)+value.slice(start+2),start,kind);
  return null;
}
