# 04 Docs: the wall is local-first, and how to use `job`

Status: done
Spec: ../spec.md (Decision 1)

- `docs/decisions.md`: 2026-11-12 entry. The wall is local-first (this PC; a VPS maybe later; never
  part of llamapoker.com). Consequence: the site's signup posts don't reach it, and North star keeps
  reading Beehiiv directly.
- `docs/state.md` and `docs/roadmap.md`: drop "Deploy the wall" from open work. Roadmap item 0
  becomes "renders in The machine" (this spec) and drops the Workers-cron line (it assumed a
  deployed wall).
- `apps/wall/README.md`: say local-first at the top; retitle "Deploy" to "Deploying elsewhere
  (optional)"; add the `job` wrapper, the `jobs` table and `/api/job` to the API and Files sections.
- `apps/reels/README.md`: render commands shown with `job` in front.

Do the decisions/state/roadmap part with the grilling (done 2026-11-12). README parts land with 02/03.

## Comments

2026-11-12: done. decisions/state/roadmap with the grilling; wall and reels READMEs with 02 and 05.
