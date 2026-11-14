/**
 * Work: "what is being made to improve it?". One slim strip with a line per department, CONTENT
 * and DEVELOPMENT (spec: .scratch/wall-layout/spec.md, decision 4). A line is collapsed (name,
 * state word, the latest thing that happened) and opens down to its stations and today's job
 * traces, on click or by itself when anything in it is failed, stuck or lost. A station opens in
 * place into its evidence. Snapshots stored before this layout have no `work`: they say so.
 */
import { useEffect, useState } from "react";
import type { Job, Station, WorkLine } from "../model";
import { fetchEvents, fetchJobs, clock } from "../lib/api";
import { Pane, Evidence, Empty } from "../components/ui";
import { trace } from "../lib/jobs";
import type { PanelProps } from "./registry";

const STATE_WORD: Record<Station["state"], string> = { ok: "OK", idle: "IDLE", waiting: "WAITING", failed: "FAILED", paused: "PAUSED", nodata: "NO DATA" };
const tone = (s: Station["state"]) => (s === "failed" ? "rd" : s === "waiting" || s === "paused" ? "am" : s === "nodata" || s === "idle" ? "dim" : "");

export function Work({ state, open, setOpen, wall, flash }: PanelProps) {
  const lines = state.work;
  // Lines the founder opened or closed by hand, with what the line said then. A click holds only
  // until something new happens on the line (its `latest` changes): a new failure opens it again.
  const [manual, setManual] = useState<Record<string, { open: boolean; latest: string | null }>>({});
  if (!lines) {
    return (
      <Pane id="work" title="WORK" question="What is being made to improve it?" flash={flash} tag={`SNAPSHOT ${state.day}`}>
        <Empty>NO WORK LINES IN THIS SNAPSHOT</Empty>
      </Pane>
    );
  }
  const bad = lines.some((l) => l.state === "failed");
  const waiting = lines.some((l) => l.state === "waiting" || l.state === "paused");
  const isOpen = (l: WorkLine) => {
    const m = manual[l.id];
    return m && m.latest === l.latest ? m.open : l.open;
  };
  const opened = open?.startsWith("station:") ? lines.flatMap((l) => l.stations).find((s) => "station:" + s.id === open) : undefined;
  return (
    <Pane id="work" title="WORK" question="What is being made to improve it?" tone={bad ? "red" : waiting ? "amber" : undefined} flash={flash} tag={lines.map((l) => `${l.name} ${l.word}`).join(" · ")}>
      <ul className="work">
        {lines.map((l) => (
          <li key={l.id} className={`wl ${l.state}${isOpen(l) ? " open" : ""}`}>
            <div className="wl-h" onClick={() => !wall && setManual((m) => ({ ...m, [l.id]: { open: !isOpen(l), latest: l.latest } }))}>
              <span className="caret">{isOpen(l) ? "▾" : "▸"}</span>
              <span className="nm">{l.name}</span>
              <span className={`word ${tone(l.state)}`}>{l.word}</span>
              <span className="latest">{l.latest ?? "nothing yet today"}</span>
              <span className="count faint">{l.stations.length} STATION{l.stations.length === 1 ? "" : "S"}</span>
            </div>
            {isOpen(l) && (
              <div className="wl-b">
                <ul className="stations">
                  {l.stations.map((s) => (
                    <li key={s.id} className={opened?.id === s.id ? "open" : ""} onClick={() => !wall && setOpen(opened?.id === s.id ? null : "station:" + s.id)}>
                      <span className="nm">{s.name.toUpperCase()}</span>
                      <span className={`st ${tone(s.state)}`}>{STATE_WORD[s.state]}</span>
                      <span className="msg">{s.message ?? ""}</span>
                      <span className="when dim">LAST {s.lastRun ? clock(s.lastRun, state.day) : "--"}</span>
                    </li>
                  ))}
                  {l.stations.length === 0 && <li className="faint">no station reports to {l.name} yet</li>}
                </ul>
                <Traces stations={l.stations} live={state.live} />
              </div>
            )}
          </li>
        ))}
      </ul>
      {opened && <StationEvidence station={opened} />}
    </Pane>
  );
}

/** Today's jobs from GET /api/jobs every 5 s while `on`, while the page is visible; null until the first answer. */
function useLiveJobs(on: boolean): Job[] | null {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => {
    if (!on) {
      setJobs(null);
      return;
    }
    let alive = true;
    const pull = () => {
      if (document.visibilityState !== "visible") return;
      fetchJobs()
        .then((r) => alive && setJobs(r.jobs))
        .catch(() => undefined);
    };
    pull();
    const t = setInterval(pull, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [on]);
  return jobs;
}

/** A clock that ticks every second while something runs, so elapsed times move between readings. */
function useNow(ticking: boolean): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!ticking) return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [ticking]);
  return now;
}

/**
 * Today's local jobs (`job <command>`) of one line's stations, one trace each, grouped under
 * their station: a bar with the phase word, or "running" when the tool prints no progress; red
 * when stuck, failed or lost, with the log to read. Shown only when there are jobs.
 */
function Traces({ stations, live }: { stations: Station[]; live: boolean }) {
  const ids = new Set(stations.map((s) => s.id));
  const fromState = stations.flatMap((s) => s.jobs ?? []);
  const running = live && fromState.some((j) => j.state === "running");
  const polled = useLiveJobs(running);
  // While something runs, GET /api/jobs every few seconds; the full reading only comes every 60 s.
  const jobs = running && polled ? polled.filter((j) => ids.has(j.station)) : fromState;
  const byStation = new Map<string, Job[]>();
  for (const j of jobs) byStation.set(j.station, [...(byStation.get(j.station) ?? []), j]);
  const order = stations.map((s) => s.id);
  const groups = [...byStation.entries()]
    .sort(([a], [b]) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .map(([id, js]) => ({ id, jobs: js }));
  const now = useNow(running);
  if (!groups.length) return null;
  return (
    <div className="traces">
      {groups.map((s) => (
        <div key={s.id} className="tr-group">
          <div className="tr-st">{s.id.toUpperCase()}</div>
          <div className="tr-list">
            {s.jobs.map((j) => {
              const t = trace(j, now);
              const pct = t.percent ?? 0;
              return (
                <div key={j.id} className={`tr ${t.tone}`} title={j.tail ?? undefined}>
                  <span className="tr-name">{t.name}</span>
                  <span className="tr-phase">{t.percent === null ? "" : (t.phase ?? "")}</span>
                  <span className={`tr-bar${t.percent === null ? " unknown" : ""}`}>
                    <i style={{ width: `${t.percent === null ? 100 : pct}%` }} />
                  </span>
                  <span className="tr-pct">{t.percent === null ? (j.state === "running" ? "running" : "") : `${pct}%`}</span>
                  <span className="tr-el">{t.elapsed}</span>
                  <span className="tr-word">{t.word}</span>
                  <span className="tr-note">{t.note ?? ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StationEvidence({ station }: { station: Station }) {
  const [events, setEvents] = useState<unknown[] | null>(null);
  useEffect(() => {
    let on = true;
    fetchEvents({ station: station.id, limit: "20" })
      .then((r) => on && setEvents(r.events))
      .catch(() => on && setEvents([]));
    return () => {
      on = false;
    };
  }, [station.id]);
  return (
    <div className="drawer">
      <div className="drawer-h">
        {station.name.toUpperCase()} · {station.state.toUpperCase()} · {station.message ?? ""}
      </div>
      <div className="drawer-cols">
        <Evidence
          data={
            station.jobs?.length
              ? station.jobs.map((j) => ({ label: j.label, state: j.state, started: j.startedAt, ended: j.endedAt, output: j.output, log: j.log, lastLines: j.tail }))
              : (station.evidence ?? "no evidence recorded for this station")
          }
        />
        <Evidence data={events === null ? "loading events…" : events.length ? events : "no events from this station in the store"} />
      </div>
    </div>
  );
}
