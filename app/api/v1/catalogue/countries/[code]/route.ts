import { authenticate, notFound, ok } from "@/lib/api";
import { getCountryCatalogue } from "@/lib/catalogue";
import { countryName } from "@/lib/countries";

type Context = { params: Promise<{ code: string }> };

/** What a country is known for, a practical tip, and all its souvenirs. */
export async function GET(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const code = (await params).code.toUpperCase();
  const catalogue = await getCountryCatalogue(code);
  if (!catalogue) return notFound("Country");

  return ok({
    country: {
      code,
      name: countryName(code),
      knownFor: catalogue.notes.knownFor,
      goodToKnow: catalogue.notes.goodToKnow,
    },
    souvenirs: catalogue.items,
  });
}
