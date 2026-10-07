import { z } from "zod";
import type { FieldKey, LabelFields, LabelRecognition } from "./extract";

export const labelKeys:FieldKey[]=["brand","name","modelName","manufacturedAt","serialNumber","category"];
const candidate=z.object({value:z.string().max(120).nullable(),evidence:z.string().max(160).nullable()}).strict();
export const aiLabelSchema=z.object({brand:candidate,name:candidate,modelName:candidate,manufacturedAt:candidate,serialNumber:candidate,category:candidate}).strict();
export type AiLabel=z.infer<typeof aiLabelSchema>;
export type AiComparison={ocr:string;ai:string;agreement:"MATCH"|"DIFFERENT"|"AI_ONLY"|"OCR_ONLY"|"EMPTY";confidence:"HIGH"|"MEDIUM"|"LOW";evidence:string};
export function compareLabelResults(ocr:LabelRecognition,ai:AiLabel):Record<FieldKey,AiComparison>{
  return Object.fromEntries(labelKeys.map(key=>{
    const old=ocr.suggestions[key].confidence==="LOW"?"":ocr.suggestions[key].value;
    const next=ai[key].value??"";
    const normalize=(value:string)=>key==="modelName"||key==="serialNumber"?value.trim().toUpperCase():value.trim().replace(/\s+/g," ");
    const agreement=old&&next?(normalize(old)===normalize(next)?"MATCH":"DIFFERENT"):next?"AI_ONLY":old?"OCR_ONLY":"EMPTY";
    return [key,{ocr:old,ai:next,agreement,confidence:agreement==="MATCH"&&!!ai[key].evidence?"HIGH":next?"MEDIUM":"LOW",evidence:ai[key].evidence??""}];
  })) as Record<FieldKey,AiComparison>;
}
export function validateAiLabel(raw:unknown):AiLabel {
  const parsed=aiLabelSchema.parse(raw);
  for(const key of labelKeys){
    const entry=parsed[key];entry.value=entry.value?.trim()||null;
    if(!entry.evidence?.trim())entry.value=null;
    if(key==="modelName"&&entry.value&&!/^(?=.*[A-Z])(?=.*\d)[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(entry.value))entry.value=null;
    if(key==="serialNumber"&&entry.value&&!/^[A-Z0-9][A-Z0-9._/-]{2,59}$/i.test(entry.value))entry.value=null;
    if(key==="category"&&entry.value&&!["APPLIANCE","FURNITURE","KITCHEN","HOUSEHOLD","DIGITAL","HOBBY","CHILDCARE","OTHER"].includes(entry.value))entry.value=null;
    if(key==="manufacturedAt"&&entry.value){const date=new Date(entry.value+"T00:00:00Z");if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.value)||!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==entry.value||+entry.value.slice(0,4)>new Date().getFullYear()||+entry.value.slice(0,4)<1900)entry.value=null;}
  }
  return parsed;
}
export function shouldOfferAi(result:LabelRecognition){return result.suggestions.modelName.confidence!=="HIGH"||labelKeys.filter(key=>result.suggestions[key].confidence!=="HIGH").length>=3;}
export type AiLabelResponse={label:AiLabel;usage:{inputTokens:number|null;outputTokens:number|null;estimatedUsd:number|null};remaining:number};
export function proposedAiFields(label:AiLabel):LabelFields{return Object.fromEntries(labelKeys.map(key=>[key,label[key].value??""])) as LabelFields;}
