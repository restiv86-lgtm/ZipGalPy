"use client";

import {useEffect,useRef,useState,type ComponentPropsWithoutRef} from "react";
import {currencyInputError,deleteFormatSeparator,formatCurrencyInput,formatDateInput,formatNumericEdit,isCompleteDate,parseCurrencyValue,type NumericFormat} from "@/lib/forms/format";
import styles from "./formatted-inputs.module.css";

type CommonInputProps=Omit<ComponentPropsWithoutRef<"input">,"defaultValue"|"name"|"onChange"|"type"|"value">&{name:string;defaultValue?:string|number|null};
type MaskProps=Omit<CommonInputProps,"name"|"defaultValue">&{kind:NumericFormat;value:string;onValueChange:(value:string)=>void};
function MaskedInput({kind,value,onValueChange,onKeyDown,...props}:MaskProps){
  const ref=useRef<HTMLInputElement>(null);
  const error=kind==="currency"?currencyInputError(value,Number(props.min??0),Number(props.max??99_999_999_999_999)):value&&!isCompleteDate(value)?"실제 날짜를 YYYY-MM-DD 형식으로 입력해 주세요.":"";
  useEffect(()=>{ref.current?.setCustomValidity(error);},[error]);
  function apply(input:HTMLInputElement,next:{value:string;caret:number}){
    onValueChange(next.value);
    // Restore the logical digit position after React inserts separators, including
    // edits where the formatted value itself did not change.
    requestAnimationFrame(()=>{if(document.activeElement===input)input.setSelectionRange(next.caret,next.caret);});
  }
  return <input {...props} ref={ref} type="text" inputMode="numeric" autoComplete="off" placeholder={kind==="date"?"YYYY-MM-DD":props.placeholder} maxLength={kind==="date"?undefined:props.maxLength} pattern={kind==="date"?"\\d{4}-\\d{2}-\\d{2}":undefined} value={value}
    onChange={event=>{const input=event.currentTarget;apply(input,formatNumericEdit(input.value,input.selectionStart??input.value.length,kind));}}
    onKeyDown={event=>{onKeyDown?.(event);if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;const input=event.currentTarget,next=deleteFormatSeparator(value,input.selectionStart??0,input.selectionEnd??0,event.key,kind);if(next){event.preventDefault();apply(input,next);}}}/>;
}
type CurrencyProps=CommonInputProps&{value?:string|number|null;onValueChange?:(rawValue:string)=>void};
export function FormattedCurrencyInput({name,defaultValue,value,onValueChange,...props}:CurrencyProps){
  const [localValue,setLocalValue]=useState(()=>formatCurrencyInput(defaultValue));
  const display=value===undefined?localValue:formatCurrencyInput(value),raw=parseCurrencyValue(display);
  function change(next:string){setLocalValue(next);onValueChange?.(parseCurrencyValue(next));}
  return <div className={styles.currencyWrap}><input type="hidden" name={name} value={raw} disabled={props.disabled}/><MaskedInput {...props} kind="currency" value={display} onValueChange={change}/><span className={styles.currencyUnit} aria-hidden="true">원</span></div>;
}
type DateProps=CommonInputProps&{value?:string;onValueChange?:(value:string)=>void};
function DatePicker({value,onValueChange,label,disabled,readOnly,min,max}:{value:string;onValueChange:(v:string)=>void;label:string;disabled?:boolean;readOnly?:boolean;min?:string|number;max?:string|number}){
  return <input className={styles.nativeDate} type="date" aria-label={`${label} 달력에서 선택`} disabled={disabled||readOnly} min={min===undefined?undefined:String(min)} max={max===undefined?undefined:String(max)} value={isCompleteDate(value)?value:""} onChange={event=>onValueChange(event.currentTarget.value)}/>;
}
export function FormattedDateInput({name,defaultValue,value,onValueChange,"aria-label":label,...props}:DateProps){
  const [localValue,setLocalValue]=useState(()=>formatDateInput(String(defaultValue??"")));
  const display=value===undefined?localValue:formatDateInput(value);
  function change(next:string){setLocalValue(next);onValueChange?.(next);}
  return <div className={styles.dateGroup}><input type="hidden" name={name} value={display} disabled={props.disabled}/><MaskedInput {...props} aria-label={label} kind="date" value={display} onValueChange={change}/><DatePicker {...props} label={label??"날짜"} value={display} onValueChange={change}/></div>;
}
export function FormattedDateTimeInput({name,defaultValue,"aria-label":label,...props}:CommonInputProps){
  const initial=String(defaultValue??"");
  const [date,setDate]=useState(()=>formatDateInput(initial.slice(0,10))),[time,setTime]=useState(()=>initial.slice(11,16)||"09:00");
  return <div className={styles.dateTimeGroup}><input type="hidden" name={name} value={date?`${date}T${time}`:""} disabled={props.disabled}/><MaskedInput {...props} aria-label={label} kind="date" value={date} onValueChange={setDate}/><DatePicker {...props} label={label??"날짜"} value={date} onValueChange={setDate}/><input className={styles.timeInput} type="time" aria-label={`${label??"일정"} 시간`} value={time} onChange={event=>setTime(event.currentTarget.value)} required={props.required} disabled={props.disabled} readOnly={props.readOnly}/></div>;
}
