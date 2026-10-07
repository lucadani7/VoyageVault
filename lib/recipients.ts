import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipients } from "@/db/schema";
import { isUuid } from "./trips";

/** A user's recipients in alphabetical order. */
export async function getRecipients(userId: string) {
  return db
    .select()
    .from(recipients)
    .where(eq(recipients.userId, userId))
    .orderBy(asc(recipients.name), asc(recipients.createdAt));
}

/** One recipient, or null when missing or owned by someone else. */
export async function getRecipient(userId: string, recipientId: string) {
  if (!isUuid(recipientId)) return null;

  const [recipient] = await db
    .select()
    .from(recipients)
    .where(and(eq(recipients.id, recipientId), eq(recipients.userId, userId)));
  return recipient ?? null;
}
