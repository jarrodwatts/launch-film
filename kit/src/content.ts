/**
 * Every word on screen, every person and every logo. Scenes read from here, never hard-code copy,
 * so a copy pass is one file and `npm run clearance` can see every real person and asset.
 *
 * The demo: Acme turns a group chat's plan into bookings. Talk becomes action.
 */

/**
 * Someone who appears on screen.
 * - self: the product's own team or account.   - brand: a company account.
 * - real: a real person. Needs consent "yes" before release, and only does what they agreed to.
 * - fictional: an invented person. A generated face needs a recorded `source` (model and terms).
 */
export type Person = {
  readonly key: string;
  readonly name: string;
  /** Short display name, as the platform would show it. */
  readonly display: string;
  readonly handle?: string;
  /** A picture under public/, e.g. "faces/x/someone.jpg". Without one, initials on a colour. */
  readonly face?: string;
  readonly kind: "self" | "brand" | "real" | "fictional";
  /** Only draw a check mark where the real account has one. */
  readonly verified?: "blue" | "business" | "government" | "none";
  readonly consent?: "yes" | "pending";
  /** Where the face or account came from (fetch date, generator and its licence). */
  readonly source?: string;
};

/**
 * A logo file under public/ and how it fits its round disc (check every one on `npm run assets`):
 * - "cover" (default): the art is already a full-bleed square or circle.
 * - { inset: 0.18 }: a mark on a transparent or white field, shrunk inside the disc.
 * - { scale: 1.42 }: art with its own border or padding, zoomed until no sliver shows.
 */
export type Logo = { readonly file: string; readonly fit?: "cover" | { readonly inset: number } | { readonly scale: number } };

/** Logos by "kind:name". */
export const LOGOS: Record<string, Logo> = {
  "brand:acme": { file: "logos/acme.svg" },
  "partner:a": { file: "logos/partner-a.svg" },
  "partner:b": { file: "logos/partner-b.svg", fit: { inset: 0.18 } },
  "partner:c": { file: "logos/partner-c.svg", fit: { scale: 1.42 } },
  "partner:d": { file: "logos/partner-d.svg", fit: { inset: 0.12 } },
};

/** The group chat. Fictional people with initials only: the demo has no faces. */
export const PEOPLE: readonly Person[] = [
  { key: "maya", name: "Maya", display: "Maya", kind: "fictional" },
  { key: "jon", name: "Jon", display: "Jon", kind: "fictional" },
  { key: "ines", name: "Ines", display: "Ines", kind: "fictional" },
  { key: "theo", name: "Theo", display: "Theo", kind: "fictional" },
];

export const COPY = {
  hook: {
    chat: [
      { who: "maya", text: "we should do a trip this summer" },
      { who: "jon", text: "lisbon??" },
      { who: "ines", text: "yes!! august" },
      { who: "theo", text: "i'm in" },
      { who: "maya", text: "someone make a doc" },
    ],
    question: "ok but who's\nactually booking it?",
    /** The one word in the brand colour. */
    accentWord: "booking",
  },
  reveal: {
    title: "Lisbon, August 14 to 18",
    sub: "4 friends, 1 plan",
    rows: [
      { logo: "partner:a", what: "Flights", detail: "4 seats, Aug 14" },
      { logo: "partner:b", what: "Apartment", detail: "4 nights, Alfama" },
      { logo: "partner:c", what: "Dinner", detail: "Fri, 8pm, table for 4" },
      { logo: "partner:d", what: "Tram tour", detail: "Sat morning" },
    ],
    button: "Book it",
    booked: "of 4 booked",
    done: "All booked",
  },
  close: {
    /** Lands a piece per beat in close.json `words`. */
    line: ["Plans that", "actually", "happen."],
    accentWord: "happen.",
    wordmark: "Acme",
    cta: "Try Acme",
    url: "acme.example",
  },
} as const;
