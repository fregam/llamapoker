/**
 * <Select> — a custom dropdown styled like the rest of the app. A native <select>
 * opens an OS-drawn list (system font, bright blue highlight) that CSS can't style.
 * Button + listbox popover with full keyboard support: Enter / Space / ↓ open;
 * ↑ ↓ Home End move; Enter / Space pick; Esc / Tab close; typing a letter jumps to the
 * next option starting with it. Keys it handles don't reach the page's hotkeys
 * (PlayTool's B / N / arrows), because the React handler stops propagation.
 * Options can carry a right-aligned note (e.g. the range's % of hands).
 * Used by: components/OpponentRanges.
 */

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
  note?: string;
}

export function Select({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex((o) => o.value === value));

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, [open]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (open) list.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    setActive(selected);
    setOpen(true);
  }
  function choose(i: number) {
    setOpen(false);
    if (options[i] && options[i].value !== value) onChange(options[i].value);
  }

  function onKeyDown(e: KeyboardEvent) {
    const k = e.key;
    if (!open) {
      if (k === "Enter" || k === " " || k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        openList();
      }
      return;
    }
    if (k === "Tab") return setOpen(false);
    e.preventDefault();
    e.stopPropagation(); // while open, every key belongs to the dropdown
    if (k === "Escape") setOpen(false);
    else if (k === "ArrowDown") setActive((a) => Math.min(options.length - 1, a + 1));
    else if (k === "ArrowUp") setActive((a) => Math.max(0, a - 1));
    else if (k === "Home") setActive(0);
    else if (k === "End") setActive(options.length - 1);
    else if (k === "Enter" || k === " ") choose(active);
    else if (k.length === 1) {
      // Type-ahead: jump to the next option starting with this letter.
      const ch = k.toLowerCase();
      for (let step = 1; step <= options.length; step++) {
        const i = (active + step) % options.length;
        if (options[i].label.toLowerCase().startsWith(ch)) {
          setActive(i);
          break;
        }
      }
    }
  }

  return (
    <div className={open ? "select select-open" : "select"} ref={root}>
      <button
        type="button"
        className="select-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${ariaLabel}: ${options[selected]?.label ?? ""}`}
        aria-controls={id}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="select-value">{options[selected]?.label}</span>
        <svg className="select-chevron" width="9" height="5" viewBox="0 0 9 5" aria-hidden="true">
          <path d="M.5.5l4 4 4-4" fill="none" stroke="currentColor" />
        </svg>
      </button>
      {open && (
        <ul className="select-list" role="listbox" id={id} ref={list} aria-label={ariaLabel}>
          {options.map((o, i) => (
            <li
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === selected}
              className={[
                "select-option",
                i === active ? "select-option-active" : "",
                i === selected ? "select-option-selected" : "",
              ].join(" ")}
              onPointerEnter={() => setActive(i)}
              onPointerDown={(e) => e.preventDefault() /* keep focus on the button */}
              onClick={() => choose(i)}
            >
              <span>{o.label}</span>
              {o.note && <span className="select-note">{o.note}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
