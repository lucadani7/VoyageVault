import { db } from "@/db";
import { recipients } from "@/db/schema";
import { authenticate, invalid, ok, readJson } from "@/lib/api";
import { recipientShape } from "@/lib/api-shapes";
import { getRecipients } from "@/lib/recipients";
import { validateRecipient } from "@/lib/validation";

/** List the people the signed-in user buys souvenirs for. */
export async function GET() {
  const { user, response } = await authenticate();
  if (!user) return response;

  const people = await getRecipients(user.id);
  return ok({ recipients: people.map(recipientShape) });
}

/** Add a person. */
export async function POST(request: Request) {
  const { user, response } = await authenticate();
  if (!user) return response;
  const { body, response: bodyError } = await readJson(request);
  if (!body) return bodyError;

  const input = validateRecipient(body);
  if (!input.ok) return invalid(input.error);

  const [created] = await db
    .insert(recipients)
    .values({ ...input.value, userId: user.id })
    .returning();
  return ok({ recipient: recipientShape(created) }, 201);
}
