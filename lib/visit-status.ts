/**
 * Whether a stop is in the past, happening now, or still ahead.
 * Kept free of database imports so browser code can use it too.
 */
export const VISIT_STATUSES = ["visited", "visiting", "planned"] as const;

export type VisitStatus = (typeof VISIT_STATUSES)[number];

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  visited: "Already visited",
  visiting: "Visiting",
  planned: "Planning to visit",
};
