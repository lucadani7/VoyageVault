import type { ShopKind } from "@/lib/shops/overpass";

/**
 * Marker colour per kind of place. Kept apart from the map component on
 * purpose: that file loads Leaflet, which cannot run on the server, while
 * the list beside the map needs these colours there too.
 */
export const KIND_COLORS: Record<ShopKind, string> = {
  gift: "#dc2626",
  craft: "#7c3aed",
  market: "#ea580c",
  sweets: "#db2777",
  antiques: "#a16207",
  museum: "#2563eb",
};
