/**
 * The command bar: one key opens it, you type what you want. Commands are parsed in App.tsx
 * (`act`); this file only shows the input and the matching commands. Guarded actions (the
 * kill switch) need their full phrase typed, so a stray key can never pause the operation.
 */
import { useEffect, useRef, useState } from "react";

export interface Command {
  name: string; // what to type (first word, plus arguments in <angle brackets>)
  hint: string;
}

export const COMMANDS: Command[] = [
  { name: "go <panel>", hint: "bring a panel forward: results, needs, work, feed, budget" },
  { name: "open <station>", hint: "open a station's evidence in place" },
  { name: "call <id>", hint: "approve a waiting piece (id or start of its title)" },
  { name: "fold <id>", hint: "reject a waiting piece" },
  { name: "raise <id> <note>", hint: "send a piece back with a note" },
  { name: "day <YYYY-MM-DD>", hint: "scrub the wall to a past day's snapshot" },
  { name: "today", hint: "back to live" },
  { name: "pause now", hint: "KILL SWITCH: pause all outbound activity (guarded: type the full phrase)" },
  { name: "resume", hint: "turn the kill switch off" },
  { name: "ceiling <eur>", hint: "set the monthly budget ceiling" },
  { name: "note <text>", hint: "write a note event to the store" },
  { name: "wall", hint: "wall mode for the second screen (no controls, larger type)" },
  { name: "overlays", hint: "toggle scanlines and vignette" },
  { name: "briefing", hint: "read the Gentleman's briefing again" },
  { name: "reload", hint: "read the state again now" },
  { name: "logout", hint: "close the wall" },
];

export function CommandBar({ open, onClose, run }: { open: boolean; onClose: () => void; run: (cmd: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) {
      setText("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  if (!open) return null;
  const q = text.trim().toLowerCase();
  const matches = COMMANDS.filter((c) => !q || c.name.startsWith(q.split(" ")[0]) || c.hint.toLowerCase().includes(q));
  const submit = async (cmd: string) => {
    if (!cmd.trim()) return;
    setBusy(true);
    try {
      await run(cmd.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bar-wrap" onClick={onClose}>
      <div className="bar" onClick={(e) => e.stopPropagation()}>
        <div className="bar-in">
          <span className="prompt">&gt;</span>
          <input
            ref={input}
            value={text}
            disabled={busy}
            onChange={(e) => {
              setText(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") setSel((s) => Math.min(matches.length - 1, s + 1));
              else if (e.key === "ArrowUp") setSel((s) => Math.max(0, s - 1));
              else if (e.key === "Tab") {
                e.preventDefault();
                const m = matches[sel];
                if (m) setText(m.name.split(" <")[0] + " ");
              } else if (e.key === "Enter") void submit(text);
              e.stopPropagation();
            }}
            placeholder="type a command"
            spellCheck={false}
          />
        </div>
        <ul className="bar-list">
          {matches.map((c, i) => (
            <li key={c.name} className={i === sel ? "sel" : ""} onMouseEnter={() => setSel(i)} onClick={() => (c.name.includes("<") ? setText(c.name.split(" <")[0] + " ") : void submit(c.name))}>
              <span className="n">{c.name}</span>
              <span className="h">{c.hint}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
