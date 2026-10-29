/**
 * Everything the film shows: this week's takes on the timeline, the position Auni builds for
 * the hero take, the venues it can use, and the people who copy it.
 * Logos are the app's own (apps/web/public), venue marks from their sites.
 */
export type Person = { readonly name: string; readonly handle: string; readonly face?: string; readonly photo?: string; readonly initials?: string; readonly colour?: string; readonly verified?: boolean };
export type Tweet = Person & { readonly text: string; readonly likes: number; readonly verified?: boolean; readonly ago: string };

const person = (name: string, handle: string, look: { face?: string; photo?: string; initials?: string; colour?: string; verified?: boolean }): Person => ({ name, handle, ...look });

/** You, in the film: a real account people on CT will recognise (picture from X, 2026-10-28). */
export const YOU = person("Jarrod Watts", "jarrodwatts", { photo: "faces/x/jarrodwatts.jpg", verified: true });

/** The take the film follows. */
export const HERO: Tweet = { ...YOU, text: "Nvidia is going to $10 trillion.", likes: 12400, ago: "now" };

/**
 * The rest of the timeline, argued the week Anthropic filed to go public (late October 2026).
 * Made-up accounts: CT avatars, or faces of people who don't exist (faces/made, generated).
 */
export const TAKES: readonly Tweet[] = [
  { ...person("dev", "0xdev", { face: "penguin" }), text: "AI is the biggest bubble of our lifetime.", likes: 9800, ago: "1h" },
  { ...person("Theo", "theomarkets", { photo: "faces/made/theomarkets.jpg" }), text: "Sell your Bitcoin. Buy AI.", likes: 21800, verified: true, ago: "4h" },
  { ...person("King", "kingcalls", { face: "king" }), text: "Anthropic's IPO will be bigger than SpaceX.", likes: 7300, ago: "3h" },
  { ...person("Lena", "lenaonchain", { photo: "faces/made/lenaonchain.jpg" }), text: "Oil hits $150 before Christmas.", likes: 4100, ago: "5h" },
  { ...person("Sam", "samtrades", { photo: "faces/made/samtrades.jpg" }), text: "The Fed hikes. Nobody's ready.", likes: 6200, verified: true, ago: "6h" },
  { ...person("Jo", "jo", { photo: "faces/made/jo.jpg" }), text: "Tokenized stocks will eat Robinhood.", likes: 15600, ago: "2h" },
  { ...person("Ines", "ines", { photo: "faces/made/ines.jpg" }), text: "Ozempic is coming for fast food.", likes: 3900, ago: "8h" },
  { ...person("Kai", "kaionchain", { photo: "faces/made/kaionchain.jpg" }), text: "Chips are dead money.", likes: 5400, ago: "7h" },
];

/** What the timeline says back. */
export const REPLIES = ["this.", "100%", "screenshot this", "calling it now", "fade me", "tell me I'm wrong", "not even close", "bookmarking", "cope"];

/** Auni itself, on X: @auni_io, with its own picture from X (2026-10-28). */
export const AUNI = person("Auni", "auni_io", { photo: "faces/x/auni_io.jpg" });

/** The question, from Auni: the product asks it, then the drop answers it. */
export const QUESTION: Tweet = { ...AUNI, text: "ok but are you positioned?", likes: 0, ago: "now" };

/** What Auni looks at before it answers. */
export const RESEARCH = [
  { doing: "Reading the news", did: "Read 14 stories", found: "Anthropic files to go public", logos: [] },
  { doing: "Checking live prices", did: "Checked the price", found: "NVDA $186.40", logos: ["xstocks:NVDAx"] },
  { doing: "Checking Hyperliquid", did: "Checked Hyperliquid", found: "Longs are crowded", logos: ["venue:hyperliquid"] },
  { doing: "Checking Polymarket", did: "Checked Polymarket", found: "Most say it stays #1", logos: ["venue:polymarket"] },
  { doing: "Checking earnings", did: "Checked earnings", found: "Reports in 3 weeks", logos: ["xstocks:NVDAx"] },
  { doing: "Finding the right picks", did: "Found 4 moves", found: "", logos: ["xstocks:NVDAx", "xstocks:TSMx", "venue:hyperliquid", "venue:polymarket"] },
] as const;

/** The position: each move Auni found ("move"), what it became once placed ("did"), and where. */
export const RECEIPTS = [
  { logo: "xstocks:NVDAx", move: "Buy NVIDIA", did: "Bought NVIDIA", where: "xStocks on Monad", whereLogo: "venue:monad" },
  { logo: "xstocks:TSMx", move: "Buy TSMC", did: "Bought TSMC", where: "xStocks on Monad", whereLogo: "venue:monad" },
  { logo: "venue:hyperliquid", move: "Open a long on NVIDIA", did: "Opened a long on NVIDIA", where: "Hyperliquid", whereLogo: "venue:hyperliquid" },
  { logo: "venue:polymarket", move: "Bet Nvidia stays #1", did: "Bet Nvidia stays #1", where: "Polymarket", whereLogo: "venue:polymarket" },
] as const;

/** Every venue and market, Monad first. Named ones get a label in the pile-up. */
export const VENUES = [
  { logo: "venue:monad", name: "Monad" },
  { logo: "venue:xstocks", name: "xStocks" },
  { logo: "venue:kuru", name: "Kuru" },
  { logo: "venue:hyperliquid", name: "Hyperliquid" },
  { logo: "venue:polymarket", name: "Polymarket" },
  { logo: "venue:aave", name: "Aave" },
] as const;

export const MARKETS = [
  "venue:mon", "xstocks:AAPLx", "xstocks:TSLAx", "venue:solana", "xstocks:METAx", "landing:bitcoin", "xstocks:GOOGLx", "venue:base",
  "landing:ethereum", "xstocks:SPYx", "venue:jupiter", "xstocks:COINx", "landing:eli-lilly", "venue:arbitrum", "xstocks:MSTRx", "landing:cameco",
  "venue:usdc", "landing:rocket-lab", "venue:unichain", "landing:netflix", "xstocks:AMDx", "landing:novo-nordisk", "venue:bnb", "landing:spotify-technology",
  "landing:constellation-energy", "venue:ink", "landing:nike", "landing:planet-labs", "landing:roku", "landing:symbotic", "landing:intuitive-surgical", "landing:hims-and-hers-health",
] as const;

export const HERO_BELIEF = { name: "Nvidia goes to $10 trillion", logos: ["xstocks:NVDAx", "xstocks:TSMx", "venue:hyperliquid", "venue:polymarket"], orb: "ai-keeps-winning-5" } as const;

/**
 * The people who copy your position, in the order they arrive. In the real film these were real
 * accounts from the partner's team and investors (names and pictures from the X API, 2026-10-28);
 * here they are fictional placeholders. Ask each real person before posting; showing a real person
 * in an ad reads as an endorsement.
 */
export const COPIERS: readonly Person[] = [
  person("Mara Chen", "marachen", { photo: "faces/x/marachen.jpg", verified: true }),
  person("Dev Okafor", "devokafor", { photo: "faces/x/devokafor.jpg", verified: true }),
  person("Tomas", "_tomasr", { photo: "faces/x/_tomasr.jpg", verified: true }),
  person("Rook", "rookcalls", { photo: "faces/x/rookcalls.jpg", verified: true }),
  person("ava sundays", "avasundays", { photo: "faces/x/avasundays.jpg", verified: true }),
  person("Konstantina Alexandrou", "kalexandrou", { photo: "faces/x/kalexandrou.jpg", verified: true }),
  person("dock", "dock_dev", { photo: "faces/x/dock_dev.jpg", verified: true }),
  person("Orin", "orin", { photo: "faces/x/orin.jpg", verified: true }),
  person("Lucia R Moreno", "luciarmoreno", { photo: "faces/x/luciarmoreno.jpg", verified: true }),
  person("JAYNET", "jayonweb", { photo: "faces/x/jayonweb.jpg", verified: true }),
];

/** A logo key ("venue:monad", "xstocks:NVDAx", "landing:nike") as a file in public/. */
export function logoFile(key: string) {
  const [kind, name] = key.split(":") as [string, string];
  if (kind === "xstocks") return `venues/${name}.png`;
  if (kind === "landing") return `logos/${name}.svg`;
  const png = ["mon"];
  const special: Record<string, string> = {
    xstocks: "venues/xstocks.svg",
    kuru: "venues/kuru-mark.svg",
    aave: "venues/aave-round.png",
    jupiter: "venues/jup-round.png",
    base: "venues/base-round.png",
  };
  return special[name] ?? `venues/${name}.${png.includes(name) ? "png" : "svg"}`;
}

/**
 * How a logo sits in its circle. Most are drawn as full-bleed discs. xStocks token art is a
 * tilted square whose dark corners peek past the circle, so it is scaled up past them;
 * square marks are drawn smaller inside a white disc.
 */
export function logoFit(key: string): { readonly scale: number; readonly inset: number } {
  if (key.startsWith("xstocks:")) return { scale: 1.42, inset: 0 };
  const contained = ["venue:monad", "venue:xstocks", "venue:hyperliquid", "venue:solana", "venue:unichain"];
  return contained.includes(key) ? { scale: 1, inset: 0.18 } : { scale: 1, inset: 0 };
}
