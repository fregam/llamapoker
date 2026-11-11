/**
 * Small shared pieces of the wall: the pane frame every panel sits in, segmented digits with
 * ghost segments behind them, dotted meters, and the evidence drawer that any row opens into.
 * Visual language from docs/interface/mockups/vfd-2-batcomputer.html (cyan data, amber waiting
 * on you, red failure) with the phosphor direction's ghost digits.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Pane({ id, title, tag, question, children, tone, flash }: { id: string; title: string; tag?: ReactNode; question: string; children: ReactNode; tone?: "amber" | "red"; flash?: boolean }) {
  return (
    <section id={`pane-${id}`} className={`pane${tone ? " " + tone : ""}${flash ? " flash" : ""}`} aria-label={title} title={question}>
      <h2>{title}</h2>
      <div className="rule" />
      {tag !== undefined && <div className="tag">{tag}</div>}
      <div className="body">{children}</div>
    </section>
  );
}

/** Seven-segment number with ghost segments, one cell per digit so ghost and digit always align;
 *  `value` null shows dashes. With `fit`, the font size follows the parent's width (measured,
 *  so it works whatever the font's metrics are). */
export function Seg({ value, digits = 6, className = "", fit }: { value: number | null; digits?: number; className?: string; fit?: boolean }) {
  const text = (value === null ? "-".repeat(digits) : String(Math.round(value)).slice(-digits)).padStart(digits, " ");
  const ref = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (!fit || !ref.current?.parentElement) return;
    const el = ref.current.parentElement;
    const measure = () => setSize(Math.max(28, Math.min(140, Math.floor(el.clientWidth / (digits * 0.9)))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, digits]);
  return (
    <span ref={ref} className={`seg ${className}`} style={size ? { fontSize: size } : undefined} aria-label={value === null ? "no data" : String(value)}>
      {[...text].map((ch, i) => (
        <span className="cell" key={i}>
          <i aria-hidden>8</i>
          <b>{ch.trim() ? ch : ""}</b>
        </span>
      ))}
    </span>
  );
}

export function Meter({ share, dim }: { share: number; dim?: boolean }) {
  return (
    <span className={`meter${dim ? " dim" : ""}`}>
      <i style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }} />
    </span>
  );
}

export function Evidence({ data }: { data: unknown }) {
  return <pre className="evidence">{typeof data === "string" ? data : JSON.stringify(data, null, 2)}</pre>;
}

export const signed = (n: number | null) => (n === null ? "--" : n > 0 ? `+${n}` : String(n));

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}
