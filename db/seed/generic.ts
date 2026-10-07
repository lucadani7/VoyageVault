import { ANYWHERE } from "@/lib/countries";
import { country } from "./define";

/**
 * Suggestions that work anywhere. Used only for places the catalogue does
 * not cover (remote islands, small territories), so the answer is never
 * empty.
 */
export const generic = country(ANYWHERE, "", "", [
  ["postcards", "art", "budget", "all", "collectibles art", "Postcards with local stamps", "Stamps from small or remote places are collected around the world."],
  ["local-sweets", "food", "budget", "all", "sweets food", "Local sweets or snacks", "Whatever the local shop sells that cannot be found at home."],
  ["handicraft", "craft", "mid", "adults", "crafts tradition home-decor", "Local handicraft", "Something made nearby, bought from the person who made it where possible."],
  ["magnet", "decor", "budget", "all", "collectibles humor", "Magnet or sew-on patch", "Small, light and proof of having been somewhere few people go."],
  ["map-print", "art", "budget", "teens+", "art history nature", "Local map or print", "A map, chart or photograph of the place."],
  ["soft-toy", "toy", "budget", "child", "toys nature", "Soft toy of a local animal", "The bird, seal or other creature the place is known for."],
]).entries;
