import * as argon2 from "argon2";
import { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import type { RegisterInput } from "./validation";

const hashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export class DuplicateEmailError extends Error {}

export async function createUser(input: RegisterInput) {
  const prisma = getPrisma();
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) throw new DuplicateEmailError();

  const passwordHash = await argon2.hash(input.password, hashOptions);

  try {
    return await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        nickname: input.nickname,
      },
      select: { id: true, email: true, nickname: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DuplicateEmailError();
    }
    throw error;
  }
}

export async function authenticateUser(email: string, password: string) {
  const user = await getPrisma().user.findUnique({ where: { email } });
  if (!user) return null;

  const validPassword = await argon2.verify(user.passwordHash, password);
  if (!validPassword) return null;

  return { id: user.id, email: user.email, name: user.nickname };
}
