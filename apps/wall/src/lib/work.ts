/**
 * Whether a Work line is open (its stations and job traces showing). A line follows its own
 * `open` (true when anything in it is failed, stuck or lost) until the founder clicks it; the
 * click holds only while nothing new happens on the line. A new `latest` (a new failure, or the
 * line recovering) hands it back to its own `open`, so a fresh failure is never hidden by an old
 * click.
 */
export interface ManualToggle {
  open: boolean; // what the founder chose
  latest: string | null; // what the line said when they chose it
}

export function lineOpen(line: { open: boolean; latest: string | null }, manual: ManualToggle | undefined): boolean {
  return manual && manual.latest === line.latest ? manual.open : line.open;
}
