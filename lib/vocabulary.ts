/**
 * The fixed word lists the app is built on: who a recipient is, how old,
 * what they like, and how souvenirs are classified. Kept free of database
 * imports so browser code can use them; db/schema.ts turns them into enums.
 */

export const RELATIONSHIPS = [
  "family",
  "friend",
  "acquaintance",
  "classmate",
  "coworker",
] as const;

export const AGE_GROUPS = ["child", "teen", "adult", "senior"] as const;

export const SOUVENIR_CATEGORIES = [
  "food",
  "drink",
  "clothing",
  "accessory",
  "jewelry",
  "decor",
  "toy",
  "craft",
  "art",
  "book",
  "cosmetics",
  "music",
] as const;

export const PRICE_TIERS = ["budget", "mid", "premium"] as const;

export const RECOMMENDATION_STATUSES = [
  "suggested",
  "bought",
  "dismissed",
] as const;

/**
 * Interest tags. A recipient's `interests` are matched against a souvenir's
 * `tags`, so both columns draw from this single list.
 */
export const INTEREST_TAGS = [
  "food",
  "sweets",
  "drinks",
  "cooking",
  "fashion",
  "home-decor",
  "art",
  "history",
  "tradition",
  "science",
  "tech",
  "sports",
  "music",
  "books",
  "nature",
  "toys",
  "games",
  "jewelry",
  "beauty",
  "crafts",
  "humor",
  "collectibles",
] as const;

export type Relationship = (typeof RELATIONSHIPS)[number];
export type AgeGroup = (typeof AGE_GROUPS)[number];
export type SouvenirCategory = (typeof SOUVENIR_CATEGORIES)[number];
export type PriceTier = (typeof PRICE_TIERS)[number];
export type RecommendationStatus = (typeof RECOMMENDATION_STATUSES)[number];
export type InterestTag = (typeof INTEREST_TAGS)[number];

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  family: "Family",
  friend: "Friend",
  acquaintance: "Acquaintance",
  classmate: "Classmate",
  coworker: "Coworker",
};

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  child: "Child (under 13)",
  teen: "Teen (13–17)",
  adult: "Adult (18–64)",
  senior: "Senior (65+)",
};

export const INTEREST_LABELS: Record<InterestTag, string> = {
  food: "Food",
  sweets: "Sweets",
  drinks: "Drinks",
  cooking: "Cooking",
  fashion: "Fashion",
  "home-decor": "Home decor",
  art: "Art",
  history: "History",
  tradition: "Traditions",
  science: "Science",
  tech: "Technology",
  sports: "Sports",
  music: "Music",
  books: "Books",
  nature: "Nature",
  toys: "Toys",
  games: "Games",
  jewelry: "Jewelry",
  beauty: "Beauty",
  crafts: "Crafts",
  humor: "Humor",
  collectibles: "Collecting",
};
