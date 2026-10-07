"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipients } from "@/db/schema";
import { getRecipient } from "@/lib/recipients";
import { requireUser } from "@/lib/session";
import { isUuid } from "@/lib/trips";
import {
  AGE_GROUPS,
  type AgeGroup,
  INTEREST_TAGS,
  type InterestTag,
  RELATIONSHIPS,
  type Relationship,
} from "@/lib/vocabulary";

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

export type RecipientFormValues = {
  name: string;
  /** Empty until the user picks one; never preselected. */
  relationship: Relationship | "";
  ageGroup: AgeGroup | "";
  interests: InterestTag[];
  notes: string;
};

export type RecipientFormState = {
  error: string | null;
  /** Bumped on every submission so the form can re-read its values. */
  version: number;
  values: RecipientFormValues;
};

/** Creates a recipient, or updates one when the form carries its id. */
export async function saveRecipient(
  previous: RecipientFormState,
  formData: FormData,
): Promise<RecipientFormState> {
  const user = await requireUser();
  const recipientId = text(formData, "recipientId");

  const relationship = RELATIONSHIPS.find(
    (value) => value === text(formData, "relationship"),
  );
  const ageGroup = AGE_GROUPS.find(
    (value) => value === text(formData, "ageGroup"),
  );
  const chosen = new Set(formData.getAll("interests").map(String));
  const interests = INTEREST_TAGS.filter((tag) => chosen.has(tag));

  const values: RecipientFormValues = {
    name: text(formData, "name"),
    relationship: relationship ?? "",
    ageGroup: ageGroup ?? "",
    interests,
    notes: text(formData, "notes"),
  };
  const fail = (error: string): RecipientFormState => ({
    error,
    version: previous.version + 1,
    values,
  });

  if (!values.name) return fail("Enter the person's name.");
  if (values.name.length > 100) {
    return fail("Keep the name under 100 characters.");
  }
  if (!relationship) return fail("Choose how this person is related to you.");
  if (!ageGroup) return fail("Choose an age group.");
  if (interests.length === 0) {
    return fail("Choose at least one interest, so the suggestions can fit.");
  }
  if (values.notes.length > 500) {
    return fail("Keep the notes under 500 characters.");
  }

  const data = {
    name: values.name,
    relationship,
    ageGroup,
    interests,
    notes: values.notes || null,
  };

  if (recipientId) {
    const existing = await getRecipient(user.id, recipientId);
    if (!existing) return fail("This person no longer exists.");
    await db
      .update(recipients)
      .set(data)
      .where(
        and(eq(recipients.id, existing.id), eq(recipients.userId, user.id)),
      );
  } else {
    await db.insert(recipients).values({ ...data, userId: user.id });
  }

  revalidatePath("/recipients");
  redirect("/recipients");
}

export async function deleteRecipient(formData: FormData) {
  const user = await requireUser();
  const recipientId = text(formData, "recipientId");
  if (!isUuid(recipientId)) return;

  await db
    .delete(recipients)
    .where(and(eq(recipients.id, recipientId), eq(recipients.userId, user.id)));

  revalidatePath("/recipients");
  redirect("/recipients");
}

export async function deleteAllRecipients() {
  const user = await requireUser();

  await db.delete(recipients).where(eq(recipients.userId, user.id));

  revalidatePath("/recipients");
  redirect("/recipients");
}
