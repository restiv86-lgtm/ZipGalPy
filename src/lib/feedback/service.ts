import { getPrisma } from "@/lib/prisma";
import type { FeedbackInput } from "./validation";

function safePageUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export function createFeedback(userId: string, input: FeedbackInput) {
  return getPrisma().feedback.create({
    data: { userId, type: input.type, title: input.title, content: input.content, pageUrl: safePageUrl(input.pageUrl) },
    select: { id: true },
  });
}
