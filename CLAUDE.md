# BuildTech: New Horizons (BTNH)

## Repo

This is its own git repo (`git@github.com:kfir-braun/BTNH.git`, public),
separate from the parent workspace folder it lives under locally. Push
changes here directly; don't rely on the parent folder's git history.

## What this is
A free website about base building for the modded Minecraft modpack
**GregTech: New Horizons (GTNH)**. Focus areas: base building,
infrastructure, aesthetics, and overall efficiency. No accounts, no
monetization — the owner has no way to recoup running costs, so **every
architecture decision here optimizes for staying on free tiers**, not for
maximum capability.

## Core feature
A **Q&A page**, not a live AI chat. Players submit a question through a
form; a real person (the site owner, with help from Claude Code/OpenClaw
sessions) answers it by hand; the answer is posted publicly. This replaced
an earlier "live Claude-API chat widget" plan — that would cost real money
per visitor conversation with no revenue to offset it, so it was dropped
before being built. See "Decision history" below.

## Architecture (decided)
- **Frontend framework**: Astro. All content pages (Home, Guides,
  Reference, Showcase, Q&A) render as static HTML — no client-side
  framework/islands needed now that the live chat widget is gone.
- **Hosting**: a Cloudflare Worker with static assets (via the
  `@astrojs/cloudflare` adapter + `wrangler.jsonc`'s `assets` block) — not
  the older Cloudflare Pages git-integration product. Deploy is just
  `npm run deploy` (`astro build && wrangler deploy`) from a local/CI
  checkout; no GitHub App/Pages project connection involved. Free tier.
- **Content pipeline**: git-based Astro content collections
  (`src/content.config.ts`, Content Layer API glob loader). Guides,
  Reference, and curated Showcase writeups are Markdown files edited
  directly in the repo; a commit + push triggers the Cloudflare Pages
  rebuild. No CMS, no database for this content.
- **Q&A submission**: a single Astro API route
  (`src/pages/api/qna/submit.ts`, `prerender = false`, so it runs as a
  Cloudflare Worker function within the same Pages deploy) takes a
  question from the public form and commits it as a new Markdown file into
  `src/content/qna-pending/` **in this GitHub repo**, via the GitHub
  Contents API. No database, no paid AI API call — the only ongoing cost
  is GitHub API usage, which is free at this volume.
- **Answering questions**: because pending questions land as files in this
  repo, they're visible to the owner *and* to Claude Code/OpenClaw in any
  future session working in this folder — just read `src/content/
  qna-pending/`. Answering means: write the answer, move the file into
  `src/content/qna/` with an added `answer` (and set `answeredAt`), delete
  it from `qna-pending/`, commit, push. The next Pages deploy publishes it
  to `/qna`. This is intentionally a manual, human-in-the-loop step — see
  "Core feature" above for why.
- **Showcase submission + moderation**: same shape as Q&A conceptually but
  still using the earlier-decided design — web upload form → image in
  Cloudflare R2, entry in Cloudflare D1 with status `pending` → owner
  approves via a private admin page/endpoint → renders on `/showcase`.
  **Not built yet** (see Status). Unlike Q&A, this one genuinely needs
  R2/D1 because it's handling image uploads, not just text.
- **No live AI, no per-request API costs, anywhere in this stack.**

### Site structure / content sections
- **Home** — pitch + links into Guides, Reference, Showcase, Q&A.
- **Guides** — core content hub, one sub-section per focus area: Layouts
  (room/multiblock planning by GT voltage tier), Infrastructure (power,
  logistics/pipes/cables, automation backbone), Aesthetics (build
  showcases + style guides), Efficiency (space/throughput/energy
  optimization).
- **Reference** — quick-lookup tables (voltage tiers, machine tiers,
  recipe chains).
- **Showcase** — community-submitted build screenshots. Curated writeups
  ship via the git content pipeline; user-submitted photos need the
  R2/D1 flow above (not built).
- **Q&A** (`/qna`) — public list of answered questions, most recent first.
  Doubles as a growing FAQ/knowledge base.
- **Ask a Question** (`/qna/ask`) — the submission form.

### Target audience (decided)
The modded Minecraft community — GTNH players generally, not segmented
into new-vs-veteran tiers. The site owner is also a player and part of
that audience, not building this purely for third parties.

## Decision history
- **2026-08-14**: initial architecture drafted around a live Claude-API
  chat widget (Agent Skills, per-session Durable Objects) as the core
  feature, with OpenClaw curating content offline for it to cite. Scaffold
  built on this basis (Astro + `@astrojs/preact` chat-widget island shell,
  no backend wired up).
- **2026-08-15**: dropped the live chat entirely — no monetization on this
  site means no budget for per-conversation Claude API costs. Replaced
  with the async Q&A model above (free, and it deliberately keeps a human
  answering, which also means answer quality/accuracy is human-reviewed
  before anything public goes out). Removed `@astrojs/preact` and the
  `ChatWidget` component; site is fully static again except the one Q&A
  submission API route. Moved BTNH out of the parent workspace repo into
  its own repo (`github.com/kfir-braun/BTNH`, public) — needed a real
  GitHub repo for the submission endpoint to commit into anyway, and it
  matches how the other sibling projects (e.g. `barometer-app`) are set up.
- **2026-08-17**: deployed to Cloudflare (`npm run deploy`), live at
  `https://btnh.kfir-b41.workers.dev`. Generated the GitHub fine-grained
  PAT and set it via `wrangler secret put GITHUB_TOKEN`, then hit a real
  bug testing the first live submission: `src/pages/api/qna/submit.ts`
  used `Astro.locals.runtime.env`, which Astro v6+ removed — the
  `@astrojs/cloudflare` adapter now expects `import { env } from
  "cloudflare:workers"` instead. Fixed (also moved the `GITHUB_TOKEN`
  ambient-type augmentation in `src/env.d.ts` from `Cloudflare.Env` to the
  global `Env` interface, which is what `cloudflare:workers`'s `env`
  export is typed against), redeployed, verified a real submission commits
  correctly end-to-end.

## Status
**Live** at `https://btnh.kfir-b41.workers.dev` (2026-08-17), Q&A
submission confirmed working end-to-end. What exists:
- Astro (`astro@^7`) with `@astrojs/cloudflare` adapter. `wrangler.jsonc`
  present (project name `btnh`, `vars.GITHUB_REPO` = `kfir-braun/BTNH`,
  `vars.GITHUB_BRANCH` = `master`). `GITHUB_TOKEN` secret is set on the
  deployed Worker (`wrangler secret put`, not in any file). `env.SESSION`
  KV namespace (`btnh-session`) was auto-provisioned by
  `@astrojs/cloudflare` on first deploy — unused so far, no session
  logic in the app yet.
- Content collections (`src/content.config.ts`): `guides` (schema includes
  `section` enum + optional `voltageTier`), `reference`, `showcase`,
  `qna` (answered: `question`/`askedAt`/`answeredAt` + Markdown body as the
  answer), `qnaPending` (inbox shape: `question`/`askedAt` only — see
  `src/content/qna-pending/`, currently empty aside from a `.gitkeep`).
  One sample entry exists in each of guides/reference/showcase/qna.
- Pages: `/` (Home), `/guides` (hub) + `/guides/[section]` +
  `/guides/[section]/[slug]`, `/reference` + `/reference/[slug]`,
  `/showcase` (curated entries only — no upload form yet), `/qna` (lists
  answered questions), `/qna/ask` (submission form, vanilla JS `fetch` to
  the API route below — no framework/hydration needed).
- `src/pages/api/qna/submit.ts` — validates the question (10–500 chars,
  honeypot field must be empty), then commits a new file to
  `src/content/qna-pending/` via the GitHub Contents API using
  `import { env } from "cloudflare:workers"` for the `GITHUB_TOKEN`
  secret + `GITHUB_REPO`/`GITHUB_BRANCH` vars. **Confirmed working in
  production** — a real test submission committed correctly (see Decision
  history 2026-08-17).
- `npx astro build` succeeds — static pages prerendered, the submit route
  correctly builds as server-rendered (hybrid output, `mode: "server"`
  reported at build time even though most routes are static).
- Deployed via `npm run deploy` (`wrangler deploy`, not the Pages
  git-integration product — see Architecture above). Cloudflare account:
  `kfir@hospremiumservices.com`, same one `barometer-app` uses.

**Gotcha hit during scaffolding**: with the Cloudflare adapter,
`getStaticPaths` runs in an isolated prerender worker and cannot close over
sibling top-level `const`s declared in the same frontmatter block (throws
`ReferenceError` at build time, not dev time). Keep `getStaticPaths` bodies
fully self-contained — define any data it needs inside the function, and
put anything meant for the template (like a slug→title lookup) in a
separate `const` below it instead of one shared above it.

**Dev server note**: `astro dev` runs as a background-manageable daemon —
`astro dev --background` to start detached, `astro dev status` /
`astro dev logs` / `astro dev stop` to manage it. Running plain `astro dev`
reports "already running" if one is still up from a previous session; stop
it explicitly when done. **Observed flakiness**: the very first `astro dev`
invocation in a fresh shell has repeatedly failed/hung (once with a silent
hang with no stdout at all, once with "Dev server failed to start within
30s" and zero captured output even with output explicitly redirected to a
file) while an immediate retry of the exact same command succeeds
normally. Cause not root-caused. If a first attempt fails or hangs, kill it
and just retry once before assuming something's actually broken.

## Next steps
- Build the Showcase submission flow (R2 + D1 + admin approval) — still
  not started.
- Flesh out real guide/reference/showcase/Q&A content — current entries
  are scaffold placeholders.
- Basic abuse protection on `/api/qna/submit` beyond the honeypot +
  length check (it's an unauthenticated public POST that triggers a GitHub
  commit — a script hammering it could spam the repo and/or burn the
  GitHub token's rate limit). Cloudflare's dashboard-level rate limiting
  rules are probably enough for v1; revisit if it's actually abused.

## Open questions / decisions to make
- Auth for the future Showcase admin approval page (simple password vs.
  Cloudflare Access)
- Exact D1 schema for Showcase entries and R2 bucket/key layout

## Notes for future sessions
- Update this file as decisions are made so context carries over between
  sessions.
- Keep the Status section current: what's built, what's next, what's
  blocked.
- **Check `src/content/qna-pending/` early in any BTNH session** — that's
  the live queue of questions waiting on a human answer, and part of the
  point of this design is that you (Claude Code) can see it too.
