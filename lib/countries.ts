/** ISO 3166-1 alpha-2 codes, plus XK for Kosovo. */
const CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  );

const CODE_SET = new Set(CODES);

/**
 * Pseudo country code for catalogue entries that fit any destination.
 * "ZZ" is reserved by ISO for exactly this kind of private use.
 */
export const ANYWHERE = "ZZ";

export function isCountryCode(value: string): boolean {
  return CODE_SET.has(value);
}

/** Country name in the given language, e.g. countryName("RO") -> "Romania". */
export function countryName(code: string, locale = "en"): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** All countries as { code, name }, sorted by name in the given language. */
export function listCountries(locale = "en") {
  return CODES.map((code) => ({ code, name: countryName(code, locale) })).sort(
    (a, b) => a.name.localeCompare(b.name, locale),
  );
}

/** "Florence, Tuscany, Italy" — whichever parts of the place were filled in. */
export function placeLabel(
  place: { city: string | null; region: string | null; countryCode: string },
  locale = "en",
): string {
  return [place.city, place.region, countryName(place.countryCode, locale)]
    .filter(Boolean)
    .join(", ");
}
