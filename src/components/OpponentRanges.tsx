/**
 * Step 04 "Opponents": the opponent-count stepper and, per opponent, a range preset
 * <Select> dropdown plus an optional custom <RangeGrid> editor.
 * Also exports the opponent data model and helpers shared with the Trainer:
 *   OppSetup / newOpp   — an opponent = preset key, or "custom" + a label set
 *   oppCombos           — turns an opponent into concrete combos for the simulator
 *   oppsKey             — stable string used as a recompute key for useEquity
 *   describeOpps        — human text ("UTG open, any two cards")
 * Used by: views/PlayTool (UI + helpers), views/Trainer (helpers).
 * Uses: poker/ranges (presets, combos), components/RangeGrid, components/Step, components/Select.
 */

import { useState } from "react";
import { OPP_PRESETS, presetByKey, rangeCombos, rangePercent } from "../poker/ranges";
import type { OppRange } from "../poker/equity";
import { RangeGrid } from "./RangeGrid";
import { Step } from "./Step";
import { Select, SelectOption } from "./Select";

export interface OppSetup {
  preset: string; // an OPP_PRESETS key, or "custom"
  custom: Set<string>;
}

export const CUSTOM = "custom";

// Dropdown choices: every preset with its share of all hands, then the custom grid.
const RANGE_OPTIONS: SelectOption[] = [
  ...OPP_PRESETS.map((p) => ({
    value: p.key,
    label: p.name,
    note: `${(p.range ? rangePercent(p.range) : 100).toFixed(0)}%`,
  })),
  { value: CUSTOM, label: "Custom…", note: "grid" },
];

export function newOpp(preset = "random"): OppSetup {
  return { preset, custom: new Set() };
}

export function oppLabels(o: OppSetup): Set<string> | null {
  return o.preset === CUSTOM ? o.custom : presetByKey(o.preset).range;
}

/** Stable string describing the opponents, for recompute triggers. */
export function oppsKey(opps: OppSetup[]): string {
  return opps.map((o) => (o.preset === CUSTOM ? "c:" + [...o.custom].sort().join(",") : o.preset)).join("|");
}

const comboCache = new Map<string, OppRange>();
export function oppCombos(o: OppSetup): OppRange {
  const labels = oppLabels(o);
  if (!labels) return null;
  if (o.preset === CUSTOM) return rangeCombos(labels);
  let c = comboCache.get(o.preset);
  if (!c) {
    c = rangeCombos(labels);
    comboCache.set(o.preset, c);
  }
  return c;
}

export function describeOpps(opps: OppSetup[]): string {
  const names = opps.map((o) => (o.preset === CUSTOM ? "a custom range" : presetByKey(o.preset).name));
  if (names.every((n) => n === "Any two cards")) return `${opps.length} random ${opps.length === 1 ? "opponent" : "opponents"}`;
  return names.map((n) => (n === "Any two cards" ? "any two cards" : n)).join(", ");
}

/** Opponent count stepper plus a range picker (and optional grid) per opponent. */
export function OpponentRanges({ opps, onChange }: { opps: OppSetup[]; onChange: (o: OppSetup[]) => void }) {
  const [editing, setEditing] = useState<number | null>(null);

  function update(i: number, next: OppSetup) {
    const copy = [...opps];
    copy[i] = next;
    onChange(copy);
  }
  function setCount(n: number) {
    const count = Math.max(1, Math.min(8, n));
    const copy = opps.slice(0, count);
    while (copy.length < count) copy.push(newOpp(copy[copy.length - 1]?.preset === CUSTOM ? "random" : copy[copy.length - 1]?.preset));
    if (editing !== null && editing >= count) setEditing(null);
    onChange(copy);
  }

  return (
    <Step
      num="04"
      title="Opponents"
      aside={
        <span className="stepper">
          <button className="step-btn" onClick={() => setCount(opps.length - 1)} aria-label="Fewer opponents">
            −
          </button>
          <span className="step-value" aria-live="polite">{opps.length}</span>
          <button className="step-btn" onClick={() => setCount(opps.length + 1)} aria-label="More opponents">
            +
          </button>
        </span>
      }
    >

      <div className="opp-list">
        {opps.map((o, i) => {
          const labels = oppLabels(o);
          const pct = labels ? rangePercent(labels) : 100;
          return (
            <div className="opp-row" key={i}>
              <span className="opp-name">Opp {i + 1}</span>
              <Select
                value={o.preset}
                ariaLabel={`Opponent ${i + 1} range`}
                options={RANGE_OPTIONS}
                onChange={(key) => {
                  if (key === CUSTOM) {
                    // Start the custom grid from whatever was selected before.
                    const start = oppLabels(o);
                    update(i, { preset: CUSTOM, custom: new Set(start ?? []) });
                    setEditing(i);
                  } else {
                    update(i, { ...o, preset: key });
                    if (editing === i) setEditing(null);
                  }
                }}
              />
              <span className="opp-pct">{pct.toFixed(0)}%</span>
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  if (o.preset !== CUSTOM) update(i, { preset: CUSTOM, custom: new Set(labels ?? []) });
                  setEditing(editing === i ? null : i);
                }}
                aria-expanded={editing === i}
              >
                {editing === i ? "done" : "edit"}
              </button>
            </div>
          );
        })}
      </div>

      {editing !== null && opps[editing] && (
        <div className="opp-editor">
          <p className="quick-hint">
            Opponent {editing + 1}: click or drag across hands to add / remove them. Suited above the
            diagonal, offsuit below.
          </p>
          <RangeGrid
            range={opps[editing].custom}
            onChange={(next) => update(editing, { preset: CUSTOM, custom: next })}
          />
        </div>
      )}
    </Step>
  );
}
