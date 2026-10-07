import { country, type CountrySeed } from "../define";

/**
 * Notes for the twelve countries whose souvenirs live in ../catalog.ts,
 * plus a few extra rows for them.
 */
export const featured: CountrySeed[] = [
  country("AU", "Beaches, the Outback, the Great Barrier Reef and wildlife found nowhere else.", "Biosecurity rules are among the strictest in the world: declare all food, plant and wooden items on arrival."),
  country("RO", "Transylvanian castles, painted monasteries, the Carpathians and the Danube Delta.", "On 1 March people give each other mărțișor charms; stalls sell them from mid-February."),
  country("FR", "Food and wine, fashion, art museums and the Eiffel Tower.", "Residents of non-EU countries can claim a VAT refund (détaxe) on larger purchases made in one shop on the same day."),
  country("IT", "Art cities, Roman ruins, regional cooking and design.", "Buying counterfeit designer goods from street sellers is illegal, and the buyer can be fined too."),
  country("ES", "Beaches, late dinners, flamenco, football and Gaudí's architecture.", "Jamón and other meat products cannot be taken into many countries outside the EU."),
  country("DE", "Christmas markets, beer, castles, cars and engineering.", "Most shops are closed on Sundays; Christmas markets run from late November until just before Christmas."),
  country("PT", "Azulejo tiles, port wine, fado, surfing and custard tarts.", "Avoid antique azulejos at flea markets: many have been stolen from building façades."),
  country("TR", "Bazaars, Istanbul's mosques, Cappadocia and Mediterranean beaches.", "Taking antiques, old carpets, old coins or even stones from ancient sites out of the country without a permit is a crime."),
  country("GR", "Ancient sites, islands, olive oil and the birthplace of democracy.", "Exporting antiquities is a serious crime; buy only certified museum replicas."),
  country("GB", "Royal pageantry, pubs, museums, football and green countryside.", "The UK is outside the EU, so customs allowances apply on the way home; the big national museums are free."),
  country("JP", "Temples, cherry blossom, cuisine, anime and bullet trains.", "Visitors can shop tax-free on showing a passport; every station sells boxed regional sweets (omiyage) meant as gifts."),
  country("BR", "Carnival, football, the Amazon, beaches and coffee.", "Products made from wild animals, feathers or coral are illegal to buy or export.", [
    ["artist-shirt", "clothing", "budget", "teens+", "music fashion", "Brazilian music T-shirt", "A shirt or record by a local artist, from samba and bossa nova greats to today's sertanejo and funk stars."],
  ]),
];
