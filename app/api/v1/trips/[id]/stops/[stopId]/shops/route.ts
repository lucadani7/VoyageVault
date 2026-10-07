import { authenticate, fail, notFound, ok } from "@/lib/api";
import { getShopsNear, ShopSearchUnavailable } from "@/lib/shops";
import { getTrip } from "@/lib/trips";

type Context = { params: Promise<{ id: string; stopId: string }> };

/** Places around a stop where souvenirs can be bought, nearest first. */
export async function GET(_request: Request, { params }: Context) {
  const { user, response } = await authenticate();
  if (!user) return response;

  const { id, stopId } = await params;
  const trip = await getTrip(user.id, id);
  const stop = trip?.stops.find((item) => item.id === stopId);
  if (!trip || !stop) return notFound("Stop");

  if (stop.lat === null || stop.lng === null) {
    return ok({ shops: [], located: false });
  }

  try {
    const shops = await getShopsNear({ lat: stop.lat, lng: stop.lng, city: stop.city });
    return ok({ shops, located: true });
  } catch (error) {
    if (error instanceof ShopSearchUnavailable) {
      return fail(502, "upstream_unavailable", error.message);
    }
    throw error;
  }
}
