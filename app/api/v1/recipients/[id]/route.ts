import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { recipients } from "@/db/schema";
import { authenticate, invalid, notFound, ok, readJson } from "@/lib/api";
import { recipientShape } from "@/lib/api-shapes";
import { getRecipient } from "@/lib/recipients";
import { validateRecipient } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

/** One person's profile. */
export async function GET(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const recipient = await getRecipient(user.id, (await params).id);
  return recipient ? ok({ recipient: recipientShape(recipient) }) : notFound("Person");
}

/** Replace a person's profile. */
export async function PUT(request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const existing = await getRecipient(user.id, (await params).id);
  if (!existing) return notFound("Person");

  const input = validateRecipient(body);
  if (!input.ok) return invalid(input.error);

  const [updated] = await db
    .update(recipients)
    .set(input.value)
    .where(and(eq(recipients.id, existing.id), eq(recipients.userId, user.id)))
    .returning();
  return ok({ recipient: recipientShape(updated) });
}

/** Delete a person. */
export async function DELETE(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const existing = await getRecipient(user.id, (await params).id);
  if (!existing) return notFound("Person");

  await db
    .delete(recipients)
    .where(and(eq(recipients.id, existing.id), eq(recipients.userId, user.id)));
  return new Response(null, { status: 204 });
}
