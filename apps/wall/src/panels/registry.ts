/**
 * Panels are modules. Each declares the question it answers, the data it reads, its place on
 * the wall (a grid area in styles.css) and its key. App.tsx renders this list and nothing else,
 * so adding, removing or reordering a panel touches only this file and the panel's own file.
 * A panel with `enabled` returning false is not on the wall (no placeholders for things that
 * produce no data yet).
 */
import type { FC } from "react";
import type { Reading } from "../lib/api";
import { Machine } from "./Machine";
import { North } from "./North";
import { Threats } from "./Threats";
import { Approvals } from "./Approvals";
import { Channels } from "./Channels";
import { Feed } from "./Feed";
import { Budget } from "./Budget";

export interface PanelProps {
  state: Reading;
  open: string | null; // what is expanded in place, e.g. "station:site", "threat:paused", "queue:<id>"
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
  area: "mach" | "north" | "threats" | "channels" | "feed" | "queue" | "budget";
  phone?: boolean; // part of the phone view (briefing, threats, approvals)
  enabled?: (s: Reading) => boolean;
  Component: FC<PanelProps>;
}

export const panels: PanelModule[] = [
  {
    id: "machine",
    key: "1",
    title: "THE MACHINE",
    question: "Is anything in the pipeline stuck or broken, and where?",
    reads: ["stations", "events (7 days)", "site probe", "Beehiiv"],
    area: "mach",
    Component: Machine,
  },
  {
    id: "threats",
    key: "2",
    title: "THREATS",
    question: "What is going wrong or about to, and what do I do first?",
    reads: ["stations", "queue", "flags", "budget", "signup events"],
    area: "threats",
    phone: true,
    Component: Threats,
  },
  {
    id: "north",
    key: "3",
    title: "NORTH STAR",
    question: "Are subscribers growing, and what changed today?",
    reads: ["Beehiiv subscriptions", "view events"],
    area: "north",
    Component: North,
  },
  {
    id: "approvals",
    key: "4",
    title: "APPROVALS",
    question: "What is waiting on me, and can I decide it now?",
    reads: ["queue"],
    area: "queue",
    phone: true,
    Component: Approvals,
  },
  {
    id: "channels",
    key: "5",
    title: "CHANNELS",
    question: "Which channel is bringing subscribers, and which went quiet?",
    reads: ["Beehiiv subscriptions (first touch)", "view events"],
    area: "channels",
    Component: Channels,
  },
  {
    id: "feed",
    key: "6",
    title: "LIVE FEED",
    question: "What just happened?",
    reads: ["events"],
    area: "feed",
    Component: Feed,
  },
  {
    id: "budget",
    key: "7",
    title: "EXPERIMENTS AND BUDGET",
    question: "Is a test ready to call, and is spend inside the ceiling?",
    reads: ["event costs (month)", "flags: budget_ceiling, experiments"],
    area: "budget",
    Component: Budget,
  },
];
