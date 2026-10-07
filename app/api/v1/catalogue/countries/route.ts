import { authenticate, ok } from "@/lib/api";
import { getCataloguedCountries } from "@/lib/catalogue";

/** The countries and territories the souvenir catalogue covers. */
export async function GET() {
  const { user, response } = await authenticate();
  if (!user) return response;

  return ok({ countries: await getCataloguedCountries() });
}
