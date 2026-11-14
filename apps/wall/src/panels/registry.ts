/**
 * Panels are modules. Each declares the question it answers, the data it reads, its place on
 * the wall (a grid area in styles.css) and its key. App.tsx renders this list and nothing else,
 * so adding, removing or reordering a panel touches only this file and the panel's own file.
 * A panel with `enabled` returning false is not on the wall (no placeholders for things that
 * produce no data yet).
 *
 * The order is the founder's order of questions (spec: .scratch/wall-layout/spec.md): how are we
 * doing (Results), what needs me (Needs you), what is being made (Work), then Feed and Budget.
 */
import type { FC } from "react";
import type { Reading } from "../lib/api";
import { Results } from "./Results";
import { NeedsYou } from "./NeedsYou";
import { Work } from "./Work";
import { Feed } from "./Feed";
import { Budget } from "./Budget";

export interface PanelProps {
  state: Reading;
  open: string | null; // what is expanded in place, e.g. "station:site", "threat:paused", "queue:<id>", "row:newsletter"
  setOpen: (id: string | null) => void;
  act: (command: string) => Promise<void>; // the same commands the command bar takes
  wall: boolean; // wall mode: no controls, larger type
  flash: boolean; // the reading just changed
}

export interface PanelModule {
  id: string;
  key: string; // keyboard shortcut that brings it forward
  title: string;
  question: string; // the question the founder would act on; if it cannot be named, cut the panel
  reads: string[];
  area: "results" | "needs" | "work" | "feed" | "budget";
  phone?: boolean; // part of the phone view
  enabled?: (s: Reading) => boolean;
  Component: FC<PanelProps>;
}

export const panels: PanelModule[] = [
  {
    id: "results",
    key: "1",
    title: "RESULTS",
    question: "How are we doing?",
    reads: ["revenue, followers and post events (30 days)", "Beehiiv subscriptions and posts"],
    area: "results",
    Component: Results,
  },
  {
    id: "needs",
    key: "2",
    title: "NEEDS YOU",
    question: "What is going wrong, and what is waiting on me?",
    reads: ["stations", "jobs", "queue", "flags", "budget", "signup events"],
    area: "needs",
    phone: true,
    Component: NeedsYou,
  },
  {
    id: "work",
    key: "3",
    title: "WORK",
    question: "What is being made to improve it?",
    reads: ["stations (by department)", "today's jobs", "site probe"],
    area: "work",
    Component: Work,
  },
  {
    id: "feed",
    key: "4",
    title: "LIVE FEED",
    question: "What just happened?",
    reads: ["events"],
    area: "feed",
    Component: Feed,
  },
  {
    id: "budget",
    key: "5",
    title: "EXPERIMENTS AND BUDGET",
    question: "Is a test ready to call, and is spend inside the ceiling?",
    reads: ["event costs (month)", "flags: budget_ceiling, experiments"],
    area: "budget",
    Component: Budget,
  },
];
