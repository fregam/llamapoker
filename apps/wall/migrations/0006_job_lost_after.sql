-- lost_after: seconds of silence before a running job reads as lost. NULL = the 2-minute
-- heartbeat rule of the `job` wrapper. Claude agents (scripts/claude-agents.mjs) report only when
-- they start and finish, so they carry a longer limit (.scratch/wall-research).

ALTER TABLE jobs ADD COLUMN lost_after INTEGER;
