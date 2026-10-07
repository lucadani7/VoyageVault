import { INTEREST_LABELS, RELATIONSHIP_LABELS } from "../vocabulary";
import type { Reason } from "./score";

export { PRICE_LABELS } from "../vocabulary";

/** Turns a scoring reason into a short phrase for the person reading. */
export function explain(reason: Reason): string {
  switch (reason.kind) {
    case "region":
      return `Typical of ${reason.region}`;
    case "season":
      return "In season during the visit";
    case "interests":
      return `Matches interests: ${reason.tags
        .map((tag) => INTEREST_LABELS[tag])
        .join(", ")}`;
    case "relationship": {
      const who = RELATIONSHIP_LABELS[reason.relationship].toLowerCase();
      return reason.priceTier === "premium"
        ? `A special gift for ${who}`
        : `Well priced for a ${who}`;
    }
  }
}
