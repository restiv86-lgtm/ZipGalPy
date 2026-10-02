"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import {
  formatCurrencyInput,
  formatDateInput,
  isCompleteDate,
  parseCurrencyValue,
} from "@/lib/forms/format";
import styles from "./formatted-inputs.module.css";

type CommonInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "defaultValue" | "name" | "onChange" | "type" | "value"
> & {
  name: string;
  defaultValue?: string | number | null;
};

export function FormattedCurrencyInput({ name, defaultValue, ...props }: CommonInputProps) {
  const [displayValue, setDisplayValue] = useState(() => formatCurrencyInput(defaultValue));
  const rawValue = parseCurrencyValue(displayValue);

  return (
    <div className={styles.currencyWrap}>
      <input type="hidden" name={name} value={rawValue} />
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onChange={(event) => setDisplayValue(formatCurrencyInput(event.currentTarget.value))}
      />
      <span className={styles.currencyUnit} aria-hidden="true">원</span>
    </div>
  );
}

export function FormattedDateInput({ name, defaultValue, "aria-label": ariaLabel, ...props }: CommonInputProps) {
  const [displayValue, setDisplayValue] = useState(() => formatDateInput(String(defaultValue ?? "")));
  const dateValue = isCompleteDate(displayValue) ? displayValue : "";

  return (
    <div className={styles.dateGroup}>
      <input type="hidden" name={name} value={dateValue} />
      <input
        {...props}
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        pattern="\d{4}-\d{2}-\d{2}"
        value={displayValue}
        onChange={(event) => setDisplayValue(formatDateInput(event.currentTarget.value))}
      />
      <input
        className={styles.nativeDate}
        type="date"
        aria-label={`${ariaLabel ?? "날짜"} 달력에서 선택`}
        value={dateValue}
        onChange={(event) => setDisplayValue(event.currentTarget.value)}
      />
    </div>
  );
}

export function FormattedDateTimeInput({ name, defaultValue, "aria-label": ariaLabel, ...props }: CommonInputProps) {
  const initial = String(defaultValue ?? "");
  const [dateValue, setDateValue] = useState(() => formatDateInput(initial.slice(0, 10)));
  const [timeValue, setTimeValue] = useState(() => initial.slice(11, 16) || "09:00");
  const completeDate = isCompleteDate(dateValue) ? dateValue : "";
  const combinedValue = completeDate && timeValue ? `${completeDate}T${timeValue}` : "";

  return (
    <div className={styles.dateTimeGroup}>
      <input type="hidden" name={name} value={combinedValue} />
      <input
        {...props}
        aria-label={ariaLabel}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="YYYY-MM-DD"
        maxLength={10}
        pattern="\d{4}-\d{2}-\d{2}"
        value={dateValue}
        onChange={(event) => setDateValue(formatDateInput(event.currentTarget.value))}
      />
      <input
        className={styles.nativeDate}
        type="date"
        aria-label={`${ariaLabel ?? "날짜"} 달력에서 선택`}
        value={completeDate}
        onChange={(event) => setDateValue(event.currentTarget.value)}
      />
      <input
        className={styles.timeInput}
        type="time"
        aria-label={`${ariaLabel ?? "일정"} 시간`}
        value={timeValue}
        onChange={(event) => setTimeValue(event.currentTarget.value)}
        required={props.required}
      />
    </div>
  );
}
