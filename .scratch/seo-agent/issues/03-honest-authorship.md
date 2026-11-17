# 03 Honest authorship on the guides

Status: needs-info
Waits on: the founder's answer to the spec's open question (whose name).

Each guide says who wrote it, when it was last changed and how its numbers are made, on the page
and in its structured data. Nothing fabricated: the Gentleman is never an author.

## Work

- [ ] Byline and "updated" date on `Guide.tsx`; `datePublished` and `dateModified` in the Article
      JSON-LD (`apps/web/src/seo.ts`), from git.
- [ ] A one-line method note on every guide: the numbers are computed by the engine that runs on
      the Table, with a link to try the same spot.
- [ ] An about page (who, why, how the numbers are made, the study-tool position), linked from
      the colophon; `Person` or `Organization` author according to the answer.
- [ ] `pages.test.tsx`: every guide has a byline and a date.

Visible text: pull request left open for the founder.
