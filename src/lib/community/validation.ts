import { z } from "zod";

export const postSchema = z.object({
  category: z.enum(["GENERAL", "QUESTION", "INFO", "LOST_AND_FOUND"]),
  title: z.string().trim().min(2, "제목을 2자 이상 입력해 주세요.").max(120),
  content: z.string().trim().min(2, "내용을 2자 이상 입력해 주세요.").max(5000),
});

export const commentSchema = z.object({ content: z.string().trim().min(1).max(1000) });

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().min(1),
  reason: z.enum(["SPAM_AD", "ABUSE", "INAPPROPRIATE", "SUSPECTED_FRAUD", "OTHER"]),
  detail: z.string().trim().max(500).optional(),
});

export const marketplaceSchema = z.object({
  type: z.enum(["SELL", "GIVEAWAY"]),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(5000),
  price: z.coerce.number().int().min(0).max(2_000_000_000),
}).superRefine((value, context) => {
  if (value.type === "SELL" && value.price < 1) context.addIssue({ code: "custom", path: ["price"], message: "판매 가격을 입력해 주세요." });
  if (value.type === "GIVEAWAY" && value.price !== 0) context.addIssue({ code: "custom", path: ["price"], message: "나눔 가격은 0원이어야 합니다." });
});

export const marketplaceStatusSchema = z.object({
  status: z.enum(["ACTIVE", "RESERVED", "COMPLETED", "CANCELLED"]),
});
