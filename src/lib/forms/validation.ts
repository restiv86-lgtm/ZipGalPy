import {z} from "zod";
import {isCompleteDate} from "./format";

// Preserve Date output and existing ISO/local date-time inputs while rejecting
// calendar rollover (e.g. Feb 30), null-as-epoch and loose date strings.
export const formDateSchema=z.preprocess(value=>{
  if(value instanceof Date)return value;
  if(typeof value!=="string"||!isCompleteDate(value.slice(0,10)))return new Date(NaN);
  if(value.length===10)return new Date(value+"T00:00:00.000Z");
  const time=value.match(/^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/);
  if(!time||Number(time[1])>23||Number(time[2])>59||Number(time[3]??0)>59)return new Date(NaN);
  return new Date(value);
},z.date());

export function formMoneySchema(max=99_999_999_999_999){
  return z.preprocess(value=>typeof value==="number"?value:typeof value==="string"&&/^\d+$/.test(value)?Number(value):NaN,z.number().int().min(0).max(max));
}
