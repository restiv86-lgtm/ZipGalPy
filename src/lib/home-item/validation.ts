import { z } from "zod";
export const categories=["APPLIANCE","FURNITURE","KITCHEN","HOUSEHOLD","DIGITAL","HOBBY","CHILDCARE","OTHER"] as const;
export const statuses=["USING","STORED","REPAIRING","SOLD","GIVEN_AWAY","DISPOSED"] as const;
const nullableText=(max:number)=>z.string().trim().max(max).optional().transform(v=>v||null);
const nullableDate=z.preprocess(v=>v===""||v==null?null:v,z.coerce.date().nullable());
const nullablePrice=z.preprocess(v=>v===""||v==null?null:v,z.coerce.number().int().min(0).max(99_999_999_999_999).nullable());
export const homeItemSchema=z.object({name:z.string().trim().min(1).max(120),category:z.enum(categories),brand:nullableText(80),modelName:nullableText(120),purchaseDate:nullableDate,purchasePrice:nullablePrice,warrantyUntil:nullableDate,memo:nullableText(2000),status:z.enum(statuses).default("USING")});
export type HomeItemInput=z.infer<typeof homeItemSchema>;
