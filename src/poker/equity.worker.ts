// Runs the Monte Carlo equity simulation off the main thread so the UI never
// freezes while it computes (heavier with more opponents).
import { equityVsRandom, EquityResult } from "./equity";
import { Card } from "./cards";

export interface EquityRequest {
  id: number;
  hero: [Card, Card];
  board: Card[];
  opponents: number;
  iterations: number;
}
export interface EquityResponse {
  id: number;
  result: EquityResult;
}

// `self` is typed as Window under the DOM lib; treat it as the worker scope.
const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<EquityRequest>) => {
  const { id, hero, board, opponents, iterations } = e.data;
  const result = equityVsRandom(hero, board, opponents, iterations);
  ctx.postMessage({ id, result } as EquityResponse);
};
