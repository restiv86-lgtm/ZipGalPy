import { z } from "zod";

export const feedbackSchema = z.object({
  type: z.enum(["BUG", "UX", "FEATURE_REQUEST", "QUESTION", "OTHER"]),
  title: z.string().trim().min(2, "제목을 2자 이상 입력해 주세요.").max(120),
  content: z.string().trim().min(10, "내용을 10자 이상 입력해 주세요.").max(5000),
  pageUrl: z.string().trim().max(500).nullable().optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
