export function formatCurrencyInput(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function parseCurrencyValue(value: string | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

export function formatDateInput(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 8);
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
