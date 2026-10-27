// Core card representation and deck utilities.
// A card is encoded as an integer 0..51 where:
//   rank = (card >> 2)  // 0..12  -> 2,3,4,5,6,7,8,9,T,J,Q,K,A
//   suit = (card & 3)   // 0..3   -> clubs, diamonds, hearts, spades

export type Card = number;

export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
export const SUITS = ["c", "d", "h", "s"];
export const SUIT_SYMBOL = ["♣", "♦", "♥", "♠"];
export const SUIT_COLOR = ["black", "red", "red", "black"] as const;

export function rankOf(card: Card): number {
  return card >> 2;
}

export function suitOf(card: Card): number {
  return card & 3;
}

export function makeCard(rank: number, suit: number): Card {
  return (rank << 2) | suit;
}

/** "As", "Th", "2c" -> Card. Returns -1 if invalid. */
export function parseCard(text: string): Card {
  if (!text || text.length < 2) return -1;
  const r = RANKS.indexOf(text[0].toUpperCase());
  const s = SUITS.indexOf(text[1].toLowerCase());
  if (r < 0 || s < 0) return -1;
  return makeCard(r, s);
}

export function cardLabel(card: Card): string {
  return RANKS[rankOf(card)] + SUITS[suitOf(card)];
}

const RANK_WORDS = ["Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King", "Ace"];
const SUIT_WORDS = ["clubs", "diamonds", "hearts", "spades"];

/** Spoken name for screen readers, e.g. "Ace of spades". */
export function cardName(card: Card): string {
  if (card < 0) return "empty card slot";
  return `${RANK_WORDS[rankOf(card)]} of ${SUIT_WORDS[suitOf(card)]}`;
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (let c = 0; c < 52; c++) deck.push(c);
  return deck;
}

/** Deck with the given cards removed (used cards). */
export function remainingDeck(used: Card[]): Card[] {
  const blocked = new Set(used.filter((c) => c >= 0));
  return fullDeck().filter((c) => !blocked.has(c));
}

/** Fisher–Yates in-place shuffle. */
export function shuffle(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }
  return deck;
}
