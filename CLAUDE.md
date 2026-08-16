# BuildTech: New Horizons (BTNH)

## What this is
A website about base building for the modded Minecraft modpack **GregTech: New Horizons (GTNH)**.
Focus areas: base building, infrastructure, aesthetics, and overall efficiency.

## Core feature
An AI assistant embedded in the site that gives tips and ideas to help players
with base building inside GTNH (layouts, infrastructure, aesthetics, efficiency).

## Planned architecture (early, not yet implemented)
- **Frontend framework**: Astro. Content pages (Guides, Reference, Showcase)
  render as near-static for SEO/speed; the persistent AI chat widget is a
  single hydrated island shared across every page.
- **Frontend hosting**: Cloudflare Pages. Same platform/account/toolchain as
  the Workers backend below — no cross-origin setup, one `wrangler` deploy
  pipeline for the whole project.
- **Backend/edge**: Cloudflare Workers, handling live site traffic.
- **Primary AI (live, user-facing)**: Claude (Anthropic API), using Agent
  Skills for specific base-building subtasks (e.g. reactor layouts, ore
  processing chains, factory aesthetics), plus prompt caching to keep
  repeated context (game mechanics reference, skill definitions) cheap across
  many concurrent visitor sessions.
- **Per-visitor session/conversation state**: Cloudflare Durable Objects (one
  per session) — this is the actual scaling mechanism for many concurrent
  strangers hitting the site at once, not OpenClaw.
- **OpenClaw** ([openclaw.ai](https://openclaw.ai/)) — open-source, local,
  bring-your-own-API-key personal AI agent. **Not on the live request path.**
  It's a single-user personal-agent framework (persistent identity, memory,
  heartbeats) — not built for many concurrent anonymous visitors — so its
  role here is offline/dev-time:
  - **Content pipeline**: run locally (optionally as multiple parallel
    instances) to research, draft, and curate base-building content (guides,
    layouts, aesthetic showcases) from source material (wiki/forum/Discord),
    which becomes the site's structured knowledge base that Claude Skills
    serve at request time.
  - **Project brain**: this BTNH workspace itself — tracking editorial
    decisions, content backlog, coverage gaps — the same way it already
    tracks memory/tasks for any other OpenClaw workspace.

### Division of labor (decided)
Claude Skills = what end users actually talk to, live, on every request.
OpenClaw = never talks to end users; it authors/curates the content Claude
serves, and separately keeps the project's own long-term memory.

### Site structure / content sections (decided)
- **Home** — pitch + entry point into the AI assistant.
- **Guides** — the core content hub, one sub-section per focus area:
  Layouts (room/multiblock planning by GT voltage tier), Infrastructure
  (power, logistics/pipes/cables, automation backbone), Aesthetics (build
  showcases + style guides), Efficiency (space/throughput/energy
  optimization).
- **Reference** — quick-lookup tables (voltage tiers, machine tiers, recipe
  chains). Doubles as structured knowledge the AI assistant can cite —
  feeds into the still-open content-pipeline question below.
- **Showcase** — community-submitted build screenshots/showcases, in scope
  for v1 (not deferred). Needs a submission + moderation flow — added to
  open questions below since that wasn't designed yet.
- **AI Assistant** — not a separate page. A persistent chat widget available
  on every page (matches "embedded in the site" from the project goal), so
  a player reading a Guides page can ask a follow-up without navigating away.

### Target audience (decided)
The modded Minecraft community — GTNH players generally, not segmented into
new-vs-veteran tiers. The site owner is also a player and part of that
audience, not building this purely for third parties.

### Content pipeline (decided)
Git-based Astro content collections. OpenClaw writes/edits Markdown/MDX
files directly in the repo's `content/` folder (Guides, Reference, Showcase
entries). A commit + push triggers the Cloudflare Pages rebuild. These same
files are the AI assistant's reference material — no separate content store,
no extra infra, versioned for free via git.

### Showcase submission + moderation (decided)
Web upload form on the site (image + caption/tags) → image stored in
Cloudflare R2, entry stored in Cloudflare D1 with status `pending` → site
owner approves/rejects via a small private admin page or Worker endpoint →
approved entries render on the Showcase page. Nothing is public until
approved; no third-party moderation dependency. (Note: this is the one piece
of site content that lives in D1/R2 rather than git, since it's
user-submitted at runtime — Guides/Reference/curated Showcase writeups still
go through the git content-collection pipeline above.)

## Status
Astro project scaffolded and building cleanly (2026-08-14). What exists:
- Astro (`astro@^7`) with `@astrojs/cloudflare` adapter and `@astrojs/preact`
  for the chat-widget island. `wrangler.jsonc` present (project name `btnh`).
- Content collections (`src/content.config.ts`, Content Layer API/glob
  loader): `guides` (schema includes `section` enum + optional
  `voltageTier`), `reference`, `showcase`. One sample entry per
  guides-section plus one reference and one showcase entry live under
  `src/content/`.
- Pages: `/` (Home), `/guides` (hub), `/guides/[section]` +
  `/guides/[section]/[slug]` (dynamic, driven by the `guides` collection),
  `/reference` + `/reference/[slug]`, `/showcase` (renders curated
  collection entries; user-submission upload form not built yet).
- `src/layouts/BaseLayout.astro` wraps every page with `Nav.astro` and the
  `ChatWidget` island (`client:load`), so the assistant is present
  site-wide as planned.
- `src/components/ChatWidget.tsx` (Preact) — UI shell only: open/close
  bubble, message list, input box, local-echo placeholder responses. Not
  wired to any backend yet — no Worker endpoint, no Durable Object, no
  Claude API call.
- `npx astro build` succeeds (13 static pages). Dev server verified
  serving real content on all four sections via `npx astro dev`.

**Gotcha hit during scaffolding**: with the Cloudflare adapter,
`getStaticPaths` runs in an isolated prerender worker and cannot close over
sibling top-level `const`s declared in the same frontmatter block (throws
`ReferenceError` at build time, not dev time). Keep `getStaticPaths` bodies
fully self-contained — define any data it needs inside the function, and
put anything meant for the template (like a slug→title lookup) in a
separate `const` below it instead of one shared above it.

**Dev server note**: `astro dev` in this Astro version runs as a
background-manageable daemon — `astro dev --background` to start
detached, `astro dev status` / `astro dev logs` / `astro dev stop` to
manage it. Running plain `astro dev` will report "already running" if one
is still up from a previous session; stop it explicitly when done.

## Next steps (not started)
- Wire the chat widget to a real backend: Worker endpoint + per-session
  Durable Object + Claude API (Agent Skills for base-building subtasks,
  prompt caching for shared reference context).
- Build the Showcase submission flow: upload form, R2 storage for images,
  D1 table for entries/status, private admin approval page/endpoint.
- Flesh out real guide/reference/showcase content (current entries are
  scaffold placeholders).
- Cloudflare Pages deploy pipeline (`wrangler` deploy, project/account
  linkage) — not yet connected to an actual Cloudflare account.

## Open questions / decisions to make
- Auth for the admin approval page (simple password vs. Cloudflare Access)
- Exact D1 schema for Showcase entries and R2 bucket/key layout

## Notes for future sessions
- Update this file as decisions are made so context carries over between sessions.
- Keep this section current: what's built, what's next, what's blocked.
