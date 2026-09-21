import { z } from "zod";

const email = z
  .email("올바른 이메일 주소를 입력해 주세요.")
  .max(320, "이메일 주소가 너무 깁니다.")
  .transform((value) => value.trim().toLowerCase());

const password = z
  .string()
  .min(10, "비밀번호는 10자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자 이하여야 합니다.")
  .regex(/[A-Za-z]/, "영문자를 하나 이상 포함해 주세요.")
  .regex(/[0-9]/, "숫자를 하나 이상 포함해 주세요.")
  .regex(/[^A-Za-z0-9]/, "특수문자를 하나 이상 포함해 주세요.");

export const registerSchema = z
  .object({
    email,
    password,
    passwordConfirm: z.string(),
    name: z
      .string()
      .trim()
      .min(2, "이름 또는 닉네임은 2자 이상이어야 합니다.")
      .max(30, "이름 또는 닉네임은 30자 이하여야 합니다."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;
