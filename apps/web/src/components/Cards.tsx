/**
 * <CardFace> — one playing card (corner index + centre pip) or an empty slot, always
 * rendered as a <button> with a screen-reader label. Clickable when onClick is given.
 * Used by: views/PlayTool (table slots), views/Trainer.
 * Uses: poker/cards (rank/suit decoding, names).
 */

import { Card, RANKS, SUIT_SYMBOL, SUIT_COLOR, rankOf, suitOf, cardName } from "../poker/cards";

export function CardFace({
  card,
  size = "md",
  onClick,
  active,
  faded,
  label,
}: {
  card: Card | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  active?: boolean;
  faded?: boolean;
  label?: string;
}) {
  const cls = ["card-face", `card-${size}`];
  if (active) cls.push("card-active");
  if (faded) cls.push("card-faded");
  if (onClick) cls.push("card-clickable");

  if (card === null || card < 0) {
    return (
      <button
        type="button"
        className={[...cls, "card-empty"].join(" ")}
        onClick={onClick}
        disabled={!onClick}
        aria-label={label ?? (onClick ? "Empty slot — click to choose a card" : "Empty slot")}
      >
        <span className="card-plus" aria-hidden="true">+</span>
      </button>
    );
  }
  const color = SUIT_COLOR[suitOf(card)];
  const rank = RANKS[rankOf(card)];
  const suit = SUIT_SYMBOL[suitOf(card)];
  return (
    <button
      type="button"
      className={[...cls, `card-${color}`].join(" ")}
      onClick={onClick}
      disabled={!onClick}
      aria-label={label ?? cardName(card) + (onClick ? " — click to remove" : "")}
    >
      <span className="card-corner" aria-hidden="true">
        <span className="card-rank">{rank === "T" ? "10" : rank}</span>
        <span className="card-suit">{suit}</span>
      </span>
      <span className="card-pip" aria-hidden="true">{suit}</span>
    </button>
  );
}
