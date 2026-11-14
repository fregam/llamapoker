-- jobs.log: where the run's full output is on the PC (logs/jobs/<day>/<id>.log), so a failure
-- an automated workflow ran unattended can still be read afterwards.
ALTER TABLE jobs ADD COLUMN log TEXT;
