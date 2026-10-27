import { ReactNode, useId } from "react";

/** Accessible "How is this calculated?" disclosure (native <details>). */
export function Explain({
  title = "How is this calculated?",
  children,
  open = false,
}: {
  title?: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details className="explain" open={open}>
      <summary>
        <span className="explain-icon" aria-hidden="true">
          ?
        </span>
        {title}
      </summary>
      <div className="explain-body">{children}</div>
    </details>
  );
}

/** A worked formula: a label, the equation with numbers, and the result. */
export function Formula({
  steps,
}: {
  steps: { label?: string; expr: string; result?: string }[];
}) {
  return (
    <div className="formula" role="group" aria-label="calculation steps">
      {steps.map((s, i) => (
        <div className="formula-row" key={i}>
          {s.label && <span className="formula-label">{s.label}</span>}
          <code className="formula-expr">{s.expr}</code>
          {s.result && <span className="formula-result">= {s.result}</span>}
        </div>
      ))}
    </div>
  );
}

/** Inline term with an accessible definition tooltip. */
export function Term({ children, def }: { children: ReactNode; def: string }) {
  const id = useId();
  return (
    <span className="term" tabIndex={0} aria-describedby={id} title={def}>
      {children}
      <span role="tooltip" id={id} className="term-tip">
        {def}
      </span>
    </span>
  );
}
