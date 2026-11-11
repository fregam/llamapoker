/**
 * Voice-over manifest. Each reel has one in src/vo/<id>.json, written by
 * `node scripts/vo-manifest.mjs <id>` from the take recordings in public/vo/<id>/<take>.wav:
 *   { "voice": "...", "takes": [{ "name": "hook", "file": "vo/<id>/hook.wav", "seconds": 5.2, "from": 0.12, "to": 4.98 }] }
 * `from`/`to` are where the speech starts and ends inside the file (seconds), so the words can be
 * placed on the voiced span and not on the model's leading and trailing silence. When
 * scripts/vo-align.py has written src/vo/<id>.words.json, the manifest also carries every word's
 * measured start and end, and the timeline uses those instead of estimating.
 */

export interface VoTake {
  name: string;
  file: string;
  seconds: number;
  from: number;
  to: number;
  /** Measured word times (seconds into the file) from scripts/vo-align.py, one per spoken word. */
  words?: { w: string; s: number; e: number }[];
}

export interface VoManifest {
  voice: string;
  takes: VoTake[];
}
