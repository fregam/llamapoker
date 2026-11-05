/**
 * <CardPicker> — the full deck as a 4×13 grid under the table. Clicking a card calls
 * onPick(card); PlayTool's pick() puts it in the active slot and advances to the next
 * empty one. Cards already on the table (the `used` set) are greyed out and disabled.
 * Used by: views/PlayTool.
 * Uses: poker/cards.
 */

import { Card, RANKS, SUIT_SYMBOL, makeCard, cardName } from "../poker/cards";

// Ranks strongest first; suits spades, hearts, diamonds, clubs (index into SUITS = c d h s).
const RANK_ORDER = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const SUIT_ORDER = [3, 2, 1, 0];

/** The full deck as a 4×13 grid. Click a card to put it in the slot being filled. */
export function CardPicker({
  used,
  onPick,
  prompt,
  disabled = false,
}: {
  used: Set<Card>;
  onPick: (c: Card) => void;
  prompt: string;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "picker picker-off" : "picker"}>
      <p className="picker-prompt" aria-live="polite">
        {prompt}
      </p>
      <div className="picker-grid" role="group" aria-label="Deck — choose a card">
        {SUIT_ORDER.map((s) =>
          RANK_ORDER.map((r) => {
            const c = makeCard(r, s);
            const taken = used.has(c);
            const red = s === 1 || s === 2;
            return (
              <button
                key={c}
                type="button"
                className={["pick-card", red ? "pick-red" : "", taken ? "pick-used" : ""].join(" ")}
                disabled={taken || disabled}
                onClick={() => onPick(c)}
                aria-label={cardName(c) + (taken ? " — already on the table" : "")}
              >
                <span className="pick-rank">{RANKS[r] === "T" ? "10" : RANKS[r]}</span>
                <span className="pick-suit">{SUIT_SYMBOL[s]}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
