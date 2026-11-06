/**
 * useEquity — runs the equity simulation in a web worker (poker/equity.worker.ts) and
 * returns { result, computing, resultKey }.
 * - Recomputes when `key` changes (callers build the key from the inputs, so array
 *   identities don't matter), after a short debounce.
 * - Sends two jobs per change: a quick pass (instant rough number) then a full pass;
 *   `computing` stays true until the full pass lands.
 * - If inputs change while the worker is busy, it terminates the worker and spawns a
 *   fresh one so new results never queue behind stale work.
 * - resultKey tells callers which inputs a result belongs to (the Trainer uses it).
 * Used by: views/PlayTool, views/Trainer.
 * Uses: poker/equity.worker (messages), poker/equity (types).
 */

import { useEffect, useRef, useState } from "react";
import { Card } from "../poker/cards";
import type { EquityResult, OppRange } from "../poker/equity";
import type { EquityResponse } from "../poker/equity.worker";

// A fast rough pass first so the readout appears instantly, then the full run.
const QUICK = 2500;
const FULL = 20000;

/**
 * Runs the equity simulation in a web worker whenever the inputs change
 * (debounced). Pass `key` — a string that changes whenever the inputs do —
 * so callers don't need stable array identities. Stale results are dropped.
 */
export function useEquity(
  hero: [Card, Card] | null,
  board: Card[],
  opps: OppRange[],
  key: string
): { result: EquityResult | null; computing: boolean; resultKey: string | null } {
  const [result, setResult] = useState<EquityResult | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const worker = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const firstId = useRef(0); // id of the quick pass for the current inputs
  const reqKey = useRef(key);

  const busy = useRef(false); // the worker is still chewing on a request

  function spawn() {
    const w = new Worker(new URL("../poker/equity.worker.ts", import.meta.url), { type: "module" });
    w.onmessage = (e: MessageEvent<EquityResponse>) => {
      const { id, result: r } = e.data;
      if (id < firstId.current || id > reqId.current) return; // from older inputs
      setResult(r);
      setResultKey(reqKey.current);
      if (id === reqId.current) {
        busy.current = false;
        setComputing(false); // the full pass landed
      }
    };
    worker.current = w;
  }

  useEffect(() => {
    spawn();
    return () => worker.current?.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    reqKey.current = key;
    const quickId = ++reqId.current;
    firstId.current = quickId;
    if (!hero) {
      setResult(null);
      setComputing(false);
      return;
    }
    setComputing(true);
    const fullId = ++reqId.current;
    const t = window.setTimeout(() => {
      // Don't queue behind stale work — drop it and start fresh.
      if (busy.current) {
        worker.current?.terminate();
        spawn();
      }
      busy.current = true;
      worker.current?.postMessage({ id: quickId, hero, board, opps, iterations: QUICK });
      worker.current?.postMessage({ id: fullId, hero, board, opps, iterations: FULL });
    }, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { result, computing, resultKey };
}
