/**
 * Web-worker wrapper around simulate() so the UI never freezes while it computes.
 * Message in: EquityRequest { id, hero, board, opps, iterations }.
 * Message out: EquityResponse { id, result }. The id lets useEquity drop stale replies.
 * Created by: hooks/useEquity (new Worker(new URL(...), { type: "module" })).
 * Uses: poker/equity.
 */

import { simulate, EquityResult, OppRange } from "./equity";
import { Card } from "./cards";

export interface EquityRequest {
  id: number;
  hero: [Card, Card];
  board: Card[];
  opps: OppRange[];
  iterations: number;
}
export interface EquityResponse {
  id: number;
  result: EquityResult;
}

// `self` is typed as Window under the DOM lib; treat it as the worker scope.
const ctx = self as unknown as Worker;

ctx.onmessage = (e: MessageEvent<EquityRequest>) => {
  const { id, hero, board, opps, iterations } = e.data;
  const result = simulate(hero, board, opps, iterations);
  ctx.postMessage({ id, result } as EquityResponse);
};
