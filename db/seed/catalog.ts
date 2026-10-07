import type {
  AgeGroup,
  InterestTag,
  PriceTier,
  SouvenirCategory,
} from "../schema";

export type CatalogEntry = {
  slug: string;
  countryCode: string;
  region?: string;
  category: SouvenirCategory;
  priceTier: PriceTier;
  /** Months 1-12 when it fits best; omit for all year. */
  seasonMonths?: number[];
  /** A drink without alcohol; not stored, only used by the catalogue check. */
  nonAlcoholic?: boolean;
  ageGroups: AgeGroup[];
  tags: InterestTag[];
  name: string;
  description: string;
};

const ALL: AgeGroup[] = ["child", "teen", "adult", "senior"];
const KIDS: AgeGroup[] = ["child", "teen"];
const TEEN_UP: AgeGroup[] = ["teen", "adult", "senior"];
const GROWN: AgeGroup[] = ["adult", "senior"];

export const catalog: CatalogEntry[] = [
  /* ---------------------------- Australia ---------------------------- */
  {
    slug: "au-boomerang", countryCode: "AU", category: "craft", priceTier: "mid",
    ageGroups: ALL, tags: ["tradition", "sports", "art"],
    name: "Hand-painted boomerang",
    description: "A wooden boomerang decorated by Aboriginal artists; look for one sold with the artist's name.",
  },
  {
    slug: "au-plush-koala", countryCode: "AU", category: "toy", priceTier: "budget",
    ageGroups: ["child"], tags: ["toys", "nature"],
    name: "Plush koala",
    description: "A soft koala toy, the classic gift for small children.",
  },
  {
    slug: "au-tim-tam", countryCode: "AU", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "Tim Tam biscuits",
    description: "Chocolate-coated biscuits found in every supermarket, easy to share at school or work.",
  },
  {
    slug: "au-vegemite", countryCode: "AU", category: "food", priceTier: "budget",
    ageGroups: TEEN_UP, tags: ["food", "humor"],
    name: "Jar of Vegemite",
    description: "The salty yeast spread Australians grow up on; a fun dare for friends.",
  },
  {
    slug: "au-opal-pendant", countryCode: "AU", category: "jewelry", priceTier: "premium",
    ageGroups: GROWN, tags: ["jewelry", "fashion"],
    name: "Opal pendant",
    description: "Australia produces most of the world's opal; a small pendant is a lasting gift.",
  },
  {
    slug: "au-akubra-hat", countryCode: "AU", category: "clothing", priceTier: "premium",
    ageGroups: GROWN, tags: ["fashion", "nature"],
    name: "Akubra hat",
    description: "The wide-brimmed felt bush hat, made in Australia since the 19th century.",
  },
  {
    slug: "au-macadamia", countryCode: "AU", region: "Queensland", category: "food", priceTier: "mid",
    ageGroups: ALL, tags: ["food", "sweets"],
    name: "Chocolate macadamia nuts",
    description: "Macadamias are native to Queensland; the chocolate-covered ones travel well.",
  },
  {
    slug: "au-aboriginal-art-print", countryCode: "AU", category: "art", priceTier: "mid",
    ageGroups: GROWN, tags: ["art", "tradition", "home-decor"],
    name: "Aboriginal dot-painting print",
    description: "A print from a community art centre, which ensures the artist is paid fairly.",
  },

  /* ----------------------------- Romania ----------------------------- */
  {
    slug: "ro-martisor", countryCode: "RO", category: "jewelry", priceTier: "budget",
    seasonMonths: [2, 3], ageGroups: ALL, tags: ["tradition", "jewelry", "crafts"],
    name: "Mărțișor",
    description: "A small charm on a red-and-white string, given on 1 March to welcome spring.",
  },
  {
    slug: "ro-ie-blouse", countryCode: "RO", category: "clothing", priceTier: "premium",
    ageGroups: TEEN_UP, tags: ["fashion", "tradition", "crafts"],
    name: "Ie (embroidered blouse)",
    description: "The traditional hand-embroidered blouse; patterns differ from region to region.",
  },
  {
    slug: "ro-horezu-ceramics", countryCode: "RO", region: "Vâlcea", category: "decor", priceTier: "mid",
    ageGroups: GROWN, tags: ["home-decor", "crafts", "tradition"],
    name: "Horezu ceramic plate",
    description: "Pottery with the rooster motif, a craft on UNESCO's intangible heritage list.",
  },
  {
    slug: "ro-painted-eggs", countryCode: "RO", region: "Bucovina", category: "craft", priceTier: "mid",
    seasonMonths: [3, 4, 5], ageGroups: GROWN, tags: ["tradition", "crafts", "collectibles"],
    name: "Painted Easter eggs",
    description: "Eggs decorated with fine wax-resist patterns, a speciality of Bucovina.",
  },
  {
    slug: "ro-zacusca", countryCode: "RO", category: "food", priceTier: "budget",
    seasonMonths: [9, 10, 11], ageGroups: ALL, tags: ["food", "cooking"],
    name: "Jar of zacuscă",
    description: "A roasted aubergine and pepper spread, made in autumn and eaten on bread.",
  },
  {
    slug: "ro-tuica", countryCode: "RO", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "Țuică (plum brandy)",
    description: "The national spirit, distilled from plums and offered to guests before a meal.",
  },
  {
    slug: "ro-dracula-mug", countryCode: "RO", region: "Transylvania", category: "decor", priceTier: "budget",
    ageGroups: ["teen", "adult"], tags: ["humor", "collectibles", "books"],
    name: "Dracula mug",
    description: "A tongue-in-cheek souvenir from the castles of Transylvania.",
  },
  {
    slug: "ro-rom-chocolate", countryCode: "RO", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "ROM chocolate bar",
    description: "A rum-flavoured chocolate bar in a wrapper showing the Romanian flag.",
  },

  /* ------------------------------ France ----------------------------- */
  {
    slug: "fr-eiffel-porcelain", countryCode: "FR", region: "Paris", category: "decor", priceTier: "mid",
    ageGroups: ["senior", "adult"], tags: ["home-decor", "collectibles"],
    name: "Porcelain Eiffel Tower figurine",
    description: "A delicate ornament of the tower, well suited to a display cabinet.",
  },
  {
    slug: "fr-science-kit", countryCode: "FR", region: "Paris", category: "toy", priceTier: "mid",
    ageGroups: KIDS, tags: ["science", "tech", "toys"],
    name: "Science experiment kit",
    description: "A hands-on kit from the shop of a science museum such as the Palais de la Découverte.",
  },
  {
    slug: "fr-macarons", countryCode: "FR", category: "food", priceTier: "mid",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "Box of macarons",
    description: "Almond meringue biscuits in many flavours; buy them on the last day, they keep under a week.",
  },
  {
    slug: "fr-provence-lavender", countryCode: "FR", region: "Provence", category: "cosmetics", priceTier: "budget",
    seasonMonths: [6, 7, 8], ageGroups: GROWN, tags: ["beauty", "nature", "home-decor"],
    name: "Lavender sachets",
    description: "Dried lavender from the fields of Provence, harvested in summer.",
  },
  {
    slug: "fr-marseille-soap", countryCode: "FR", region: "Provence", category: "cosmetics", priceTier: "budget",
    ageGroups: TEEN_UP, tags: ["beauty", "tradition"],
    name: "Savon de Marseille",
    description: "The traditional olive-oil soap cube, stamped with its oil content.",
  },
  {
    slug: "fr-breton-shirt", countryCode: "FR", region: "Brittany", category: "clothing", priceTier: "mid",
    ageGroups: ALL, tags: ["fashion"],
    name: "Breton striped shirt",
    description: "The navy-and-white marinière, originally the French sailor's uniform.",
  },
  {
    slug: "fr-champagne", countryCode: "FR", region: "Champagne", category: "drink", priceTier: "premium",
    ageGroups: GROWN, tags: ["drinks"],
    name: "Bottle of champagne",
    description: "Bought from a small grower, it costs less and has a story to tell.",
  },
  {
    slug: "fr-petit-prince", countryCode: "FR", category: "book", priceTier: "budget",
    ageGroups: ALL, tags: ["books", "art"],
    name: "Le Petit Prince",
    description: "An illustrated edition of Saint-Exupéry's tale, in French or in the recipient's language.",
  },

  /* ------------------------------ Italy ------------------------------ */
  {
    slug: "it-murano-glass", countryCode: "IT", region: "Veneto", category: "decor", priceTier: "premium",
    ageGroups: GROWN, tags: ["home-decor", "art", "crafts"],
    name: "Murano glass ornament",
    description: "Hand-blown glass from the island of Murano; check for the Vetro Artistico mark.",
  },
  {
    slug: "it-venetian-mask", countryCode: "IT", region: "Veneto", category: "craft", priceTier: "mid",
    seasonMonths: [1, 2], ageGroups: TEEN_UP, tags: ["art", "tradition", "collectibles"],
    name: "Venetian carnival mask",
    description: "A papier-mâché mask, most fitting around the Carnival in late winter.",
  },
  {
    slug: "it-limoncello", countryCode: "IT", region: "Campania", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "food"],
    name: "Limoncello",
    description: "Lemon liqueur from the Amalfi Coast and Sorrento, served ice cold.",
  },
  {
    slug: "it-moka-pot", countryCode: "IT", category: "decor", priceTier: "mid",
    ageGroups: GROWN, tags: ["cooking", "drinks", "home-decor"],
    name: "Moka pot",
    description: "The stovetop coffee maker found in nearly every Italian kitchen.",
  },
  {
    slug: "it-pinocchio", countryCode: "IT", region: "Tuscany", category: "toy", priceTier: "budget",
    ageGroups: ["child"], tags: ["toys", "books", "crafts"],
    name: "Wooden Pinocchio",
    description: "A painted wooden puppet of the character created by the Tuscan writer Collodi.",
  },
  {
    slug: "it-leather-wallet", countryCode: "IT", region: "Tuscany", category: "accessory", priceTier: "premium",
    ageGroups: GROWN, tags: ["fashion", "crafts"],
    name: "Florentine leather wallet",
    description: "Florence is known for its leather workshops; small goods are the easiest to bring home.",
  },
  {
    slug: "it-balsamic-vinegar", countryCode: "IT", region: "Emilia-Romagna", category: "food", priceTier: "mid",
    ageGroups: GROWN, tags: ["cooking", "food"],
    name: "Balsamic vinegar of Modena",
    description: "Aged grape-must vinegar; a small bottle goes a long way.",
  },
  {
    slug: "it-torrone", countryCode: "IT", category: "food", priceTier: "budget",
    seasonMonths: [11, 12], ageGroups: ALL, tags: ["sweets", "tradition"],
    name: "Torrone",
    description: "Honey and almond nougat, the traditional Christmas sweet.",
  },

  /* ------------------------------ Spain ------------------------------ */
  {
    slug: "es-hand-fan", countryCode: "ES", region: "Andalusia", category: "accessory", priceTier: "budget",
    ageGroups: TEEN_UP, tags: ["fashion", "tradition", "crafts"],
    name: "Hand fan (abanico)",
    description: "A painted folding fan, practical in the southern summer heat.",
  },
  {
    slug: "es-turron", countryCode: "ES", category: "food", priceTier: "budget",
    seasonMonths: [11, 12], ageGroups: ALL, tags: ["sweets", "tradition"],
    name: "Turrón",
    description: "Almond nougat from Alicante and Jijona, eaten at Christmas.",
  },
  {
    slug: "es-olive-oil", countryCode: "ES", region: "Andalusia", category: "food", priceTier: "mid",
    ageGroups: GROWN, tags: ["cooking", "food"],
    name: "Extra virgin olive oil",
    description: "Spain is the world's largest producer; a tin is safer in luggage than glass.",
  },
  {
    slug: "es-espadrilles", countryCode: "ES", category: "clothing", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["fashion"],
    name: "Espadrilles",
    description: "Canvas shoes with a rope sole, worn all summer.",
  },
  {
    slug: "es-football-scarf", countryCode: "ES", category: "clothing", priceTier: "budget",
    ageGroups: ALL, tags: ["sports", "collectibles"],
    name: "Football club scarf",
    description: "A scarf from the local club, for the fan in the family.",
  },
  {
    slug: "es-saffron", countryCode: "ES", region: "Castilla-La Mancha", category: "food", priceTier: "mid",
    ageGroups: GROWN, tags: ["cooking", "food"],
    name: "La Mancha saffron",
    description: "Protected-origin saffron, light to carry and essential for paella.",
  },
  {
    slug: "es-gaudi-mosaic", countryCode: "ES", region: "Catalonia", category: "decor", priceTier: "budget",
    ageGroups: ALL, tags: ["art", "home-decor", "collectibles"],
    name: "Gaudí-style mosaic lizard",
    description: "A small tiled figure inspired by the Park Güell salamander in Barcelona.",
  },
  {
    slug: "es-castanets", countryCode: "ES", region: "Andalusia", category: "music", priceTier: "budget",
    ageGroups: KIDS, tags: ["music", "tradition", "toys"],
    name: "Castanets",
    description: "The hand percussion of flamenco, fun for children to try.",
  },

  /* ----------------------------- Germany ----------------------------- */
  {
    slug: "de-beer-stein", countryCode: "DE", region: "Bavaria", category: "decor", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "collectibles", "tradition"],
    name: "Beer stein",
    description: "A stoneware mug with a pewter lid, the Bavarian classic.",
  },
  {
    slug: "de-cuckoo-clock", countryCode: "DE", region: "Baden-Württemberg", category: "decor", priceTier: "premium",
    ageGroups: GROWN, tags: ["home-decor", "crafts", "tradition"],
    name: "Black Forest cuckoo clock",
    description: "A carved wooden clock; genuine ones carry a Black Forest certificate.",
  },
  {
    slug: "de-nutcracker", countryCode: "DE", region: "Saxony", category: "craft", priceTier: "mid",
    seasonMonths: [11, 12], ageGroups: ALL, tags: ["tradition", "crafts", "collectibles"],
    name: "Wooden nutcracker",
    description: "A painted soldier figure from the Ore Mountains, sold at Christmas markets.",
  },
  {
    slug: "de-lebkuchen", countryCode: "DE", region: "Bavaria", category: "food", priceTier: "budget",
    seasonMonths: [11, 12], ageGroups: ALL, tags: ["sweets", "tradition"],
    name: "Nuremberg Lebkuchen",
    description: "Soft spiced gingerbread, often sold in a decorated tin.",
  },
  {
    slug: "de-haribo", countryCode: "DE", category: "food", priceTier: "budget",
    ageGroups: KIDS, tags: ["sweets"],
    name: "Haribo gummy bears",
    description: "The original gummy bears, with flavours not sold abroad.",
  },
  {
    slug: "de-ampelmann", countryCode: "DE", region: "Berlin", category: "accessory", priceTier: "budget",
    ageGroups: ALL, tags: ["humor", "history", "collectibles"],
    name: "Ampelmann keyring",
    description: "The little man from East Berlin's pedestrian lights, now a city mascot.",
  },
  {
    slug: "de-steiff-bear", countryCode: "DE", category: "toy", priceTier: "premium",
    ageGroups: ["child"], tags: ["toys", "collectibles"],
    name: "Steiff teddy bear",
    description: "From the company that made the first teddy bears, each with a button in its ear.",
  },
  {
    slug: "de-riesling", countryCode: "DE", region: "Rhineland-Palatinate", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks"],
    name: "Riesling wine",
    description: "A white wine from the Mosel or Rhine valleys.",
  },

  /* ----------------------------- Portugal ---------------------------- */
  {
    slug: "pt-azulejo-tile", countryCode: "PT", category: "decor", priceTier: "budget",
    ageGroups: GROWN, tags: ["home-decor", "art", "tradition"],
    name: "Azulejo tile",
    description: "A painted ceramic tile; buy new ones, as antique tiles are often stolen from buildings.",
  },
  {
    slug: "pt-cork-wallet", countryCode: "PT", category: "accessory", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["fashion", "nature"],
    name: "Cork wallet",
    description: "Portugal is the world's largest cork producer; the material is light and water-resistant.",
  },
  {
    slug: "pt-port-wine", countryCode: "PT", region: "Porto", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "Port wine",
    description: "Fortified wine from the Douro valley, aged in the cellars across the river from Porto.",
  },
  {
    slug: "pt-barcelos-rooster", countryCode: "PT", category: "decor", priceTier: "budget",
    ageGroups: ALL, tags: ["tradition", "collectibles", "home-decor"],
    name: "Rooster of Barcelos",
    description: "The colourful ceramic rooster, a national symbol of good luck.",
  },
  {
    slug: "pt-tinned-sardines", countryCode: "PT", category: "food", priceTier: "budget",
    ageGroups: GROWN, tags: ["food", "collectibles"],
    name: "Tinned sardines",
    description: "Sold in retro illustrated tins that are as much a gift as the fish.",
  },
  {
    slug: "pt-ginjinha", countryCode: "PT", region: "Lisbon", category: "drink", priceTier: "budget",
    ageGroups: GROWN, tags: ["drinks", "sweets"],
    name: "Ginjinha",
    description: "Sour cherry liqueur, sometimes sold with small chocolate cups.",
  },
  {
    slug: "pt-embroidered-linen", countryCode: "PT", region: "Madeira", category: "decor", priceTier: "premium",
    ageGroups: ["senior", "adult"], tags: ["home-decor", "crafts", "tradition"],
    name: "Madeira embroidery",
    description: "Hand-embroidered table linen, certified with a lead or holographic seal.",
  },
  {
    slug: "pt-fado-cd", countryCode: "PT", region: "Lisbon", category: "music", priceTier: "budget",
    ageGroups: GROWN, tags: ["music", "tradition"],
    name: "Fado recording",
    description: "A record of the melancholic Lisbon song tradition, for music lovers.",
  },

  /* ------------------------------ Türkiye ---------------------------- */
  {
    slug: "tr-turkish-delight", countryCode: "TR", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food", "tradition"],
    name: "Turkish delight (lokum)",
    description: "Soft sweets with rose, pistachio or pomegranate, sold by weight.",
  },
  {
    slug: "tr-nazar", countryCode: "TR", category: "decor", priceTier: "budget",
    ageGroups: ALL, tags: ["tradition", "home-decor", "jewelry"],
    name: "Nazar (evil eye bead)",
    description: "The blue glass charm hung in homes and cars to ward off bad luck.",
  },
  {
    slug: "tr-tea-glasses", countryCode: "TR", category: "decor", priceTier: "budget",
    ageGroups: GROWN, tags: ["drinks", "home-decor", "tradition"],
    name: "Tulip tea glasses",
    description: "A set of the small curved glasses in which Turkish tea is served.",
  },
  {
    slug: "tr-coffee-cezve", countryCode: "TR", category: "decor", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "cooking", "crafts"],
    name: "Copper cezve and coffee",
    description: "The long-handled pot for brewing Turkish coffee, paired with finely ground beans.",
  },
  {
    slug: "tr-iznik-ceramics", countryCode: "TR", category: "decor", priceTier: "mid",
    ageGroups: GROWN, tags: ["home-decor", "art", "crafts"],
    name: "İznik-style ceramic bowl",
    description: "Hand-painted pottery with tulip and carnation motifs.",
  },
  {
    slug: "tr-peshtemal", countryCode: "TR", category: "clothing", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["fashion", "beauty"],
    name: "Peştemal towel",
    description: "The thin woven cotton towel of the hammam, also used as a beach wrap.",
  },
  {
    slug: "tr-baklava", countryCode: "TR", region: "Gaziantep", category: "food", priceTier: "mid",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "Pistachio baklava",
    description: "Gaziantep is its home; shops will pack a box for travel.",
  },
  {
    slug: "tr-mosaic-lamp", countryCode: "TR", category: "decor", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["home-decor", "crafts"],
    name: "Mosaic glass lamp",
    description: "A lamp of coloured glass pieces, a favourite from the Grand Bazaar.",
  },

  /* ------------------------------ Greece ----------------------------- */
  {
    slug: "gr-olive-oil-soap", countryCode: "GR", category: "cosmetics", priceTier: "budget",
    ageGroups: TEEN_UP, tags: ["beauty", "nature"],
    name: "Olive oil soap",
    description: "Simple, gentle soap made from local olive oil.",
  },
  {
    slug: "gr-komboloi", countryCode: "GR", category: "accessory", priceTier: "budget",
    ageGroups: GROWN, tags: ["tradition", "collectibles"],
    name: "Komboloi (worry beads)",
    description: "A string of beads flipped through the fingers to pass the time.",
  },
  {
    slug: "gr-thyme-honey", countryCode: "GR", category: "food", priceTier: "mid",
    ageGroups: ALL, tags: ["food", "sweets", "nature"],
    name: "Thyme honey",
    description: "Aromatic honey from the islands, especially Crete.",
  },
  {
    slug: "gr-ouzo", countryCode: "GR", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "Ouzo",
    description: "The anise-flavoured spirit that turns cloudy with water.",
  },
  {
    slug: "gr-leather-sandals", countryCode: "GR", category: "clothing", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["fashion", "crafts"],
    name: "Handmade leather sandals",
    description: "Made to measure in small workshops in Athens and on the islands.",
  },
  {
    slug: "gr-mythology-book", countryCode: "GR", category: "book", priceTier: "budget",
    ageGroups: KIDS, tags: ["books", "history"],
    name: "Illustrated Greek myths",
    description: "A children's retelling of the myths, sold at museum shops.",
  },
  {
    slug: "gr-mastiha", countryCode: "GR", region: "Chios", category: "food", priceTier: "mid",
    ageGroups: GROWN, tags: ["food", "sweets", "tradition"],
    name: "Chios mastiha",
    description: "A resin harvested only on Chios, sold as sweets, gum or liqueur.",
  },
  {
    slug: "gr-museum-replica", countryCode: "GR", category: "art", priceTier: "mid",
    ageGroups: GROWN, tags: ["history", "art", "collectibles"],
    name: "Museum replica vase",
    description: "A certified copy of an ancient vase from an archaeological museum shop.",
  },

  /* -------------------------- United Kingdom ------------------------- */
  {
    slug: "gb-english-tea", countryCode: "GB", category: "drink", priceTier: "budget", nonAlcoholic: true,
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "English breakfast tea",
    description: "A tin of loose-leaf tea from a traditional tea merchant.",
  },
  {
    slug: "gb-shortbread", countryCode: "GB", region: "Scotland", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "Scottish shortbread",
    description: "Buttery biscuits in a tartan tin, easy to share.",
  },
  {
    slug: "gb-tartan-scarf", countryCode: "GB", region: "Scotland", category: "clothing", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["fashion", "tradition"],
    name: "Tartan lambswool scarf",
    description: "A warm scarf in a clan tartan, most welcome in the cold months.",
    seasonMonths: [10, 11, 12, 1, 2],
  },
  {
    slug: "gb-paddington", countryCode: "GB", region: "London", category: "toy", priceTier: "mid",
    ageGroups: ["child"], tags: ["toys", "books"],
    name: "Paddington Bear",
    description: "The bear in the blue duffle coat from the children's books.",
  },
  {
    slug: "gb-whisky", countryCode: "GB", region: "Scotland", category: "drink", priceTier: "premium",
    ageGroups: GROWN, tags: ["drinks", "collectibles"],
    name: "Single malt Scotch whisky",
    description: "A bottle from a distillery you visited makes it personal.",
  },
  {
    slug: "gb-double-decker", countryCode: "GB", region: "London", category: "toy", priceTier: "budget",
    ageGroups: ["child"], tags: ["toys", "collectibles"],
    name: "Red double-decker bus model",
    description: "A die-cast model of the London bus.",
  },
  {
    slug: "gb-penguin-classic", countryCode: "GB", category: "book", priceTier: "budget",
    ageGroups: TEEN_UP, tags: ["books"],
    name: "Clothbound classic novel",
    description: "A handsome edition of Austen or Dickens from a British bookshop.",
  },
  {
    slug: "gb-museum-dinosaur-kit", countryCode: "GB", region: "London", category: "toy", priceTier: "mid",
    ageGroups: KIDS, tags: ["science", "nature", "toys"],
    name: "Dinosaur excavation kit",
    description: "A dig-it-yourself fossil kit from a natural history museum shop.",
  },

  /* ------------------------------ Japan ------------------------------ */
  {
    slug: "jp-matcha-kitkat", countryCode: "JP", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food", "humor"],
    name: "Matcha KitKat",
    description: "One of the many Japan-only flavours, individually wrapped for sharing.",
  },
  {
    slug: "jp-furoshiki", countryCode: "JP", category: "accessory", priceTier: "budget",
    ageGroups: GROWN, tags: ["crafts", "tradition", "fashion"],
    name: "Furoshiki wrapping cloth",
    description: "A patterned square cloth used to wrap gifts or carry things.",
  },
  {
    slug: "jp-daruma", countryCode: "JP", category: "decor", priceTier: "budget",
    seasonMonths: [12, 1], ageGroups: ALL, tags: ["tradition", "collectibles", "home-decor"],
    name: "Daruma doll",
    description: "Paint one eye when setting a goal and the other when you reach it; popular at New Year.",
  },
  {
    slug: "jp-chopsticks", countryCode: "JP", category: "decor", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["cooking", "crafts", "home-decor"],
    name: "Lacquered chopsticks",
    description: "A pair in a gift box; some shops engrave a name while you wait.",
  },
  {
    slug: "jp-sake", countryCode: "JP", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "Sake",
    description: "Rice wine from a regional brewery, often sold in small gift bottles.",
  },
  {
    slug: "jp-gachapon", countryCode: "JP", category: "toy", priceTier: "budget",
    ageGroups: KIDS, tags: ["toys", "collectibles", "games"],
    name: "Gachapon capsule toys",
    description: "Small collectable figures from the capsule machines found everywhere.",
  },
  {
    slug: "jp-stationery", countryCode: "JP", category: "accessory", priceTier: "budget",
    ageGroups: ["teen", "adult"], tags: ["art", "crafts", "tech"],
    name: "Japanese stationery set",
    description: "Fine-tipped pens, washi tape and notebooks from a stationery store.",
  },
  {
    slug: "jp-kitchen-knife", countryCode: "JP", category: "decor", priceTier: "premium",
    ageGroups: GROWN, tags: ["cooking", "crafts"],
    name: "Japanese kitchen knife",
    description: "A hand-forged santoku; pack it in checked luggage.",
  },

  /* ------------------------------ Brazil ----------------------------- */
  {
    slug: "br-havaianas", countryCode: "BR", category: "clothing", priceTier: "budget",
    ageGroups: ALL, tags: ["fashion", "sports"],
    name: "Havaianas flip-flops",
    description: "The Brazilian rubber sandals, far cheaper at home than abroad.",
  },
  {
    slug: "br-coffee", countryCode: "BR", region: "Minas Gerais", category: "drink", priceTier: "mid", nonAlcoholic: true,
    ageGroups: GROWN, tags: ["drinks", "cooking"],
    name: "Speciality coffee beans",
    description: "Single-origin beans from the world's largest coffee producer.",
  },
  {
    slug: "br-cachaca", countryCode: "BR", category: "drink", priceTier: "mid",
    ageGroups: GROWN, tags: ["drinks", "tradition"],
    name: "Cachaça",
    description: "The sugarcane spirit at the heart of the caipirinha.",
  },
  {
    slug: "br-football-shirt", countryCode: "BR", category: "clothing", priceTier: "mid",
    ageGroups: ALL, tags: ["sports", "fashion"],
    name: "Brazil football shirt",
    description: "The yellow national team jersey.",
  },
  {
    slug: "br-brigadeiro", countryCode: "BR", category: "food", priceTier: "budget",
    ageGroups: ALL, tags: ["sweets", "food"],
    name: "Brigadeiros",
    description: "Chocolate fudge truffles rolled in sprinkles, a staple of every birthday party.",
  },
  {
    slug: "br-senhor-do-bonfim-ribbon", countryCode: "BR", region: "Bahia", category: "accessory", priceTier: "budget",
    ageGroups: ALL, tags: ["tradition", "jewelry"],
    name: "Bonfim wish ribbon",
    description: "A coloured ribbon from Salvador tied with three knots, one wish each.",
  },
  {
    slug: "br-pandeiro", countryCode: "BR", category: "music", priceTier: "mid",
    ageGroups: TEEN_UP, tags: ["music", "tradition"],
    name: "Pandeiro",
    description: "The hand frame drum of samba, compact enough for a suitcase.",
  },
  {
    slug: "br-gemstones", countryCode: "BR", region: "Minas Gerais", category: "jewelry", priceTier: "premium",
    ageGroups: GROWN, tags: ["jewelry", "nature", "collectibles"],
    name: "Brazilian gemstone jewellery",
    description: "Amethyst, tourmaline or topaz pieces from a certified jeweller.",
  },
];
