-- department: which Work line a station shows under, content | development (the results-first
-- layout, .scratch/wall-layout). Set by the station's writer (POST /api/station) or by
-- `job --dept`; NULL lets the wall decide by name (functions/_lib/derive.ts departmentOf).
-- On jobs too, so a run's --dept reaches a station the wall creates from its first job.

ALTER TABLE stations ADD COLUMN department TEXT;
ALTER TABLE jobs ADD COLUMN department TEXT;
