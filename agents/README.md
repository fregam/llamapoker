# Agents (planned)

Automation that grows LlamaPoker. Each agent gets its own folder with a README (what it
does, inputs, outputs, schedule) once it's built.

| Agent | Does | Writes to |
|---|---|---|
| research | Scans Reddit, X/Twitter and tournament results for what players talk about | `content/research/` |
| writer | Drafts articles and guides from the research, in the brand voice | `content/articles/` |
| seo | Picks keywords, checks Search Console, suggests new pages | `docs/` and `content/` |
| social | Turns articles and tips into posts and short videos (Higgsfield) | `content/social/` |

Rules: agents draft, humans approve before anything is published; follow `brand/README.md`;
keys come from the environment or `credentials.json`, never from the repo.
