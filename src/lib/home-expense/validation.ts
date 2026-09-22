import { z } from "zod";
export const expenseCategories=["PURCHASE","REPAIR","MAINTENANCE","MANAGEMENT","UTILITY","CONTRACT","INSURANCE","TAX","OTHER"] as const;
const nullableText=(max:number)=>z.string().trim().max(max).optional().transform(value=>value||null);
const nullableId=z.string().optional().transform(value=>value||null);
export const expenseSchema=z.object({homeItemId:nullableId,repairId:nullableId,category:z.enum(expenseCategories),title:z.string().trim().min(1).max(120),amount:z.coerce.number().int().min(0).max(99_999_999_999_999),expenseDate:z.coerce.date(),paymentMethod:nullableText(80),memo:nullableText(2000)});
export type ExpenseInput=z.infer<typeof expenseSchema>;
