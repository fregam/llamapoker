-- jobs.phase: the word before the progress number ("Bundling", "Rendered", "Encoded"), so a bar
-- that restarts at each phase of a multi-phase tool reads as the next phase, not as going back.
ALTER TABLE jobs ADD COLUMN phase TEXT;
