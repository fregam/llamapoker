/**
 * <Step> — a numbered section of the input columns ("01 Cards", "02 Seat"…): a header
 * with the number, a small-caps title and an optional right-aligned aside.
 * Used by: views/PlayTool, components/OpponentRanges.
 */

import { ReactNode } from "react";

export function Step({
  num,
  title,
  aside,
  children,
}: {
  num: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="step" aria-label={title}>
      <header className="step-head">
        <span className="step-num">{num}</span>
        <h2 className="step-title">{title}</h2>
        {aside && <span className="step-aside">{aside}</span>}
      </header>
      {children}
    </section>
  );
}
