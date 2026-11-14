/**
 * Approvals: the pieces waiting on the founder, dealt as cards, shown inside Needs you. Call
 * (approve), fold (reject) or raise (send back with a note). The title opens the piece exactly as
 * it would be published. Pieces reach the queue through POST /api/queue
 * (scripts/wall-event.mjs queue …) from whatever drafts them.
 */
import { useState } from "react";
import type { QueueItem } from "../model";
import { Empty } from "../components/ui";
import { clock } from "../lib/api";

/** The waiting pieces as cards: call, fold, raise. */
export function Cards({ queue: q, day, open, setOpen, act, wall }: { queue: QueueItem[]; day: string; open: string | null; setOpen: (id: string | null) => void; act: (c: string) => Promise<void>; wall: boolean }) {
  if (q.length === 0)
    return (
      <Empty>
        NOTHING WAITING ON YOU
        <small>pieces arrive here from the drafting jobs (POST /api/queue)</small>
      </Empty>
    );
  return (
    <ul className="cards">
      {q.map((item) => (
        <Card key={item.id} item={item} day={day} opened={open === "queue:" + item.id} setOpen={setOpen} act={act} wall={wall} />
      ))}
    </ul>
  );
}

function Card({ item, day, opened, setOpen, act, wall }: { item: QueueItem; day: string; opened: boolean; setOpen: (id: string | null) => void; act: (c: string) => Promise<void>; wall: boolean }) {
  const [raising, setRaising] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (cmd: string) => {
    setBusy(true);
    try {
      await act(cmd);
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className={`card${opened ? " open" : ""}`}>
      <div className="card-h" onClick={() => setOpen(opened ? null : "queue:" + item.id)}>
        <span className="kind">{item.kind.toUpperCase()}</span>
        <span className="title">{item.title}</span>
        <span className="when">{clock(item.ts, day)}</span>
      </div>
      {opened && <pre className="preview">{item.preview ?? "no preview attached"}</pre>}
      {!wall && (
        <div className="card-a">
          <button disabled={busy} onClick={() => run(`call ${item.id}`)}>
            CALL
          </button>
          <button disabled={busy} className="fold" onClick={() => run(`fold ${item.id}`)}>
            FOLD
          </button>
          <button disabled={busy} className="raise" onClick={() => setRaising((r) => !r)}>
            RAISE
          </button>
          {raising && (
            <form
              className="raise-f"
              onSubmit={(e) => {
                e.preventDefault();
                if (note.trim()) void run(`raise ${item.id} ${note.trim()}`);
              }}
            >
              <input autoFocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="what to change" />
              <button disabled={busy || !note.trim()}>SEND BACK</button>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
