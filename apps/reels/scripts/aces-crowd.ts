/**
 * Numbers and sample hands for the reel "aces-crowd": how often pocket aces win when every
 * player stays to the river, for 1 to 8 opponents holding any two cards. Uses the website's
 * own engine, so the reel never shows a typed-in number.
 *   (from apps/web)  npx vite-node ../reels/scripts/aces-crowd.ts
 * Writes apps/reels/src/data/aces-crowd.json: { win: [..8 fractions], iterations, hands: [...] }.
 */
import { writeFileSync } from "node:fs";
import { cardLabel, parseCard, remainingDeck, shuffle } from "../../web/src/poker/cards";
import { equityVsRandom } from "../../web/src/poker/equity";
import { evaluate7, categoryName } from "../../web/src/poker/evaluator";

const hero: [number, number] = [parseCard("As"), parseCard("Ah")];
const ITER = 400000;
const rows = [];
for (let n = 1; n <= 8; n++) {
  const r = equityVsRandom(hero, [], n, ITER);
  rows.push({ opponents: n, win: r.win, tie: r.tie, lose: r.lose, equity: r.equity });
  console.log(n, (r.win * 100).toFixed(1), (r.tie * 100).toFixed(1), (r.lose * 100).toFixed(1));
}

// Real dealt hands for the on-screen log (5 opponents): villain's best hand when aces lose.
const hands = [];
for (let i = 0; i < 400; i++) {
  const deck = shuffle(remainingDeck(hero));
  const opp = [0, 1, 2, 3, 4].map((k) => [deck[k * 2], deck[k * 2 + 1]]);
  const board = deck.slice(10, 15);
  const mine = evaluate7([...hero, ...board]);
  let best = -1, who = -1;
  opp.forEach((o, k) => { const s = evaluate7([...o, ...board]); if (s > best) { best = s; who = k; } });
  hands.push({
    board: board.map(cardLabel).join(" "),
    villain: opp[who].map(cardLabel).join(""),
    made: categoryName(best),
    won: mine >= best,
  });
}
writeFileSync(new URL("../src/data/aces-crowd.json", import.meta.url), JSON.stringify({ iterations: ITER, rows, hands }, null, 1));
