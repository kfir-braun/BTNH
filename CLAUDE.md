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
  "Core feature" above for why. Claude Code and OpenClaw are expected to
  actively help work this queue, not just format answers dictated to them:
  - **Consolidate near-duplicate questions** into one published entry
    instead of one entry per near-identical submission.
  - **Recognize when a "question" isn't actually one** — bug reports or
    complaints about the site itself (broken layout, wrong link, typo)
    should be fixed directly in the codebase, not published as a Q&A
    entry. Precedent: a 2026-08-17 submission reporting a missing space
    before a link turned out to be a real Astro rendering bug (see
    Decision history) — it got fixed in the code and the pending file was
    just deleted, never published.
- **`/qna` is intentionally unlinked from site navigation for now**
  (`Nav.astro` — removed 2026-08-17). The pages (`/qna`, `/qna/ask`) still
  work at their direct URLs; it's just not discoverable via the nav bar or
  Home page yet while the Q&A workflow above is still being shaken out.
  Don't re-add the nav link without being asked.
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

## OpenClaw + Discord coordination
The site owner, Claude Code, and OpenClaw coordinate on this project
(Q&A queue triage, content planning, scheduling rollouts) through a
Discord server, not through this repo alone. This is workspace-level
infrastructure (OpenClaw is not BTNH-specific — it's the owner's general
personal agent), but it's documented here because BTNH/Q&A was the
motivating use case and this is the project it'll be actively used from.

- **Server**: "KbWORKS's server" (guild ID `1537590231643983992`). Bot:
  `@clawed` (application/user ID `1537593998812643368`). **Owner plans to
  add this same bot to a second, work-related server too** — when that
  happens, its guild ID needs to be added under
  `channels.discord.guilds` (see Locking below) or the bot will be
  silently blocked from responding there. `tools.sessions.visibility`
  being agent-scoped (see below) already covers any server the bot is
  in automatically — no extra visibility config needed for a new server,
  just the allowlist entry.
- **Locking**: `channels.discord.groupPolicy` = `"allowlist"` with only
  that one guild registered under `channels.discord.guilds` — no other
  Discord server can trigger the bot, even if invited elsewhere. No
  specific channel restriction within the guild (owner's choice — Claude
  Code/OpenClaw are expected to create/organize channels within this
  server as needed, consolidating any that end up serving overlapping
  purposes rather than letting them proliferate).
- **Command owner**: `commands.ownerAllowFrom` = `["discord:1531775634072670431"]`
  (site owner's Discord user ID) — privileged actions (approvals, config
  changes, diagnostics) are gated to this user via Discord.
- **DM allowlist**: `channels.discord.allowFrom` = `["1531775634072670431"]`.
- **Messaging tool**: the "main" agent was missing the `message` tool
  (found via `openclaw doctor`), which would've silently broken replies/
  attachments even once connected. Fixed via `openclaw doctor --fix --yes`.
- **Persistence — already handled, no action needed on future startup**:
  OpenClaw's Gateway runs as a Windows Scheduled Task named
  `OpenClaw Gateway`, trigger "At logon time", no execution time limit
  (verified via `schtasks /query /tn "OpenClaw Gateway" /v /fo list` —
  this is a different/working setup from the Task Scheduler access-denied
  issue hit for `barometer-app`'s dev server; OpenClaw's own installer
  registered this one successfully). It starts automatically at every
  Windows login — you should never need to manually start it. If
  something seems disconnected, check status first rather than assuming
  it needs starting:
  ```
  openclaw daemon status
  openclaw channels status --deep
  ```
  Restart if needed: `openclaw daemon restart` (config changes to
  `channels.discord.*` or `commands.*` require this to take effect).
- **Real ground-truth check** (bypasses OpenClaw's own state entirely,
  queries Discord's API directly with the bot's token — useful if
  OpenClaw's own reporting ever seems stale/wrong):
  ```
  node -e "const fs=require('fs');const cfg=JSON.parse(fs.readFileSync(process.env.USERPROFILE+'/.openclaw/openclaw.json','utf8'));fetch('https://discord.com/api/v10/users/@me/guilds',{headers:{Authorization:'Bot '+cfg.channels.discord.token}}).then(r=>r.json()).then(j=>console.log(JSON.stringify(j)))"
  ```
- **Discord gotcha hit while setting this up (2026-08-17), costly to
  rediscover**: the bot's Developer Portal application had **"Requires
  OAuth2 Code Grant"** enabled on the Bot tab. With that on, every invite
  attempt *looked* like it worked start to finish — server selectable in
  the picker, Authorize click succeeded, captcha completed — but the bot
  never actually joined, because Discord silently waits for an OAuth2
  code exchange with a backend server that doesn't exist here. Took
  several full invite-flow retries (including regenerating the URL,
  trying the newer "Installation" page instead of the OAuth2 URL
  Generator, verifying app ID/permissions/captcha) before finding this
  toggle. **If the bot ever needs re-inviting and joins silently fail
  with no error shown, check this toggle first** before re-doing the
  invite flow from scratch. Also needed (separately): all three
  privileged Gateway Intents (Message Content, Server Members, Presence)
  enabled on the Bot tab — without them Discord closes the gateway
  connection with code 4014 ("missing privileged gateway intents").
- **Claude Code is now wired to OpenClaw via a persistent-ish MCP config**
  (2026-08-18). `openclaw attach` (the supported bridge — mints a scoped
  grant + spawns a **new** `claude` process wired to the OpenClaw gateway
  session) requires a real interactive TTY; it doesn't work from an
  automated/headless shell (fails with `Input must be provided either
  through stdin or as a prompt argument when using --print`) and can't be
  retrofitted onto an already-running session either way (MCP servers only
  load at Claude Code startup). So instead:
  - `.mcp.json` files exist at the workspace root
    (`C:\Users\kfirb\Downloads\ClaudeCode\.mcp.json`) and in this repo
    (`BTNH\.mcp.json`) — **both gitignored, never commit them** (short-lived
    token, but still a live credential). Any Claude Code session opened in
    either location automatically gets OpenClaw's MCP tools.
  - Attach grants are **hard-capped at 12 hours by the gateway** regardless
    of the `--ttl` requested (tested requesting 30 days, got capped to
    12h) — there is no way to get a truly permanent grant this way. The
    owner explicitly chose this scoped/refreshable model over the
    alternative (wiring `.mcp.json` to `gateway.auth.token`, the gateway's
    own permanent admin credential) to avoid a standing broad-access secret
    sitting in workspace files.
  - **Refresh with**: `node scripts/refresh-openclaw-mcp.js` (run from the
    workspace root) — mints a fresh grant and overwrites both `.mcp.json`
    files. Only takes effect in a **new** Claude Code session (restart
    required) — it does not affect a session already running.
  - The MCP endpoint itself (`http://127.0.0.1:<port>/mcp`) is bound by the
    Gateway process and persists as long as the Gateway is running (it's
    the same persistent Scheduled Task, not a per-attach ephemeral
    process) — but the port number can change if the Gateway restarts, so
    a refresh picks up the current port too, not just a new token.
  - If OpenClaw tools seem to have disappeared in a session, the grant
    probably expired — run the refresh script, then start a new session.
  - **Observed TTL is not reliably 12h** — one refresh only got ~1h of
    validity (mint → expiry), noticeably shorter than the 12h cap seen
    elsewhere. Likely bounded by whichever is shorter: the 12h server cap,
    or the remaining validity of the underlying `anthropic:claude-cli`
    OAuth session (`openclaw doctor` surfaces that session's own
    expiry — re-auth with `openclaw models auth login --provider
    anthropic` if it's close to expiring, since that would cap grants
    even harder). Don't assume a fresh refresh is good for a full 12h;
    check `expiresAt` in the script's output.
  - **Session visibility — set permanently to `all` scope, plus
    `tools.agentToAgent.enabled=true` (2026-08-18, upgraded same day)**:
    `openclaw config set tools.sessions.visibility all` and `openclaw
    config set tools.agentToAgent.enabled true` (both top-level config
    paths, both hot-reload). History: default is `tree` (only the grant's
    own session + spawned subagents) — couldn't see the Discord
    conversation at all (`sessions_history` → `forbidden`). Bumped to
    `agent` scope first (covers everything under the "main" agent —
    Discord DMs, guild channels, future second server), which was enough
    until the issue-hunter/issue-filer agents were created (see "Issue
    tracking" below) — `agent` scope is *per agent*, so it could NOT see
    those agents' own sessions (confirmed: `sessions_list` found zero
    matches for issue-filer's Discord activity even though it had just
    posted). Since the owner's ask was explicitly "see everything this
    bot does" and that now spans multiple OpenClaw agents acting through
    the same Discord bot, went to `all` scope instead. Verified end-to-end
    at each stage: DM session content readable after the `agent` bump;
    `issue-filer`'s own Discord post readable after the `all` bump.
- **Deferred, not blocking**: `gateway.auth.token` and
  `channels.discord.token` are stored as plaintext in
  `~\.openclaw\openclaw.json` (flagged by `openclaw secrets audit`) —
  not yet migrated to SecretRefs. The interactive `openclaw secrets
  configure` helper hangs waiting on stdin in non-interactive shells (same
  class of issue as other CLIs — see `barometer-app`'s CLAUDE.md), and a
  manual provider-based migration was judged too risky to attempt blind
  given it could break gateway/Discord auth. Revisit if the owner wants
  this hardened.
- Config lives at `~\.openclaw\openclaw.json` — global to the workspace,
  not inside this repo (not committed, not BTNH-specific).

## Issue tracking (hunter/filer workers)
A two-agent pipeline (owner's explicit design — hunting and filing are
deliberately separate so there's a control point between "found something"
and "published to the tracker"), set up 2026-08-18, scoped to BTNH for now
(the owner's plan is to extend this pattern to other repos/projects later,
e.g. a work job).

- **The public tracker, two halves**:
  - **GitHub** = source of truth. Six labels on `kfir-braun/BTNH`, one
    `status: *` per issue at a time:
    | Color | Label | Emoji | Meaning |
    |---|---|---|---|
    | Red | `status: known` | 🔴 | Known, not worked on |
    | Yellow | `status: in-progress` | 🟡 | Currently being worked on |
    | Green | `status: fixed` | 🟢 | Fixed |
    | Blue | `status: recurring` | 🔵 | Recurring problem |
    | White | `status: recurring-fixed` | ⚪ | Recurring problem, now fixed |
    | Purple | `status: workaround` | 🟣 | Can't fix directly, needs a workaround |
  - **Discord** = human-facing mirror. New channel `#issues` (guild
    `1537590231643983992`, channel id `1539368755958779994`) — one message
    per issue, emoji + title + GitHub link, edited in place as status
    changes (not reposted).
- **Two OpenClaw agents** (`openclaw agents list` to see them; both
  workspace = this repo):
  - `issue-hunter` — read-only. Scans for candidates (code TODOs, `npm run
    build` failures, `src/content/qna-pending/` entries that are actually
    bug reports, git/CLAUDE.md history for recurrence). Writes to a shared
    queue file. **Never touches GitHub or Discord.**
  - `issue-filer` — the publish gate. Reads the queue, dedupes against
    existing issues, applies judgment on whether something's actually
    worth filing (deliberately conservative — under-file rather than spam
    the tracker), files/labels the GitHub issue, posts/updates `#issues`.
    Also handles status transitions when told (`known → in-progress →
    fixed`, etc.) — see its skill for the full lifecycle rules, including
    the `recurring` (🔵) ⇄ `recurring-fixed` (⚪) transition being distinct
    from the normal `known` → `fixed` one.
- **Skills** (the actual instructions each agent follows): installed
  globally at `~\.openclaw\skills\issue-hunt\SKILL.md` and
  `~\.openclaw\skills\issue-file\SKILL.md`. Source copies are wherever this
  session's scratchpad was — the installed copies are the real ones to
  edit going forward (`openclaw skills install <dir> --as <name> --global
  --force` to update, then no restart needed — skills reload live).
- **Shared state** (both files, `~\.openclaw\shared\issue-queue\`):
  - `btnh-candidates.json` — hunter writes, filer consumes/clears.
  - `btnh-discord-map.json` — filer's own record of issue# → Discord
    channel/message id (so status updates edit in place) plus a
    self-healing `discordPending` mechanism for when a Discord post
    couldn't be sent that run (see gotcha below).
- **Scheduling**: two cron jobs (`openclaw cron list`) —
  `btnh-issue-hunt` every 12h, `btnh-issue-file` every 6h. Both created
  with `--session isolated`; delivery mode is `none` on both (the generic
  cron "announce final text to a channel" fallback isn't useful here since
  both skills already do their own explicit output — queue file for the
  hunter, GitHub+Discord writes for the filer — leaving delivery on just
  produced a spurious `Discord recipient is required` error since these
  agents aren't bound to a default channel). Manual test run:
  `openclaw cron run <job-id>` (or `openclaw agent --agent <id> --message
  "..."` for a fully custom one-off prompt, e.g. to nudge a self-heal).
- **Gotcha (hit + fixed same day)**: new agents do **not** get the
  `message` tool by default (default `tools.profile` is `coding`, which
  excludes it) — `issue-filer`'s first real run filed GitHub issue #1
  correctly but then couldn't post to Discord, and *correctly* degraded by
  recording a pending entry instead of losing the post (see skill's Phase
  0). Fixed with a narrow additive grant, not a profile swap (keeps
  git/gh/exec access intact):
  ```
  openclaw config get agents.list          # find the index - it's an array, not keyed by id
  openclaw config set "agents.list[<i>].tools.alsoAllow" --strict-json '["message"]'
  ```
- **Verified end-to-end (2026-08-18)**: real test run filed
  [BTNH#1](https://github.com/kfir-braun/BTNH/issues/1) (`status: known`,
  a benign build warning about the empty `qna-pending` glob) and posted it
  to `#issues` — confirmed independently both via `gh issue view 1` and by
  reading the Discord message back through Claude Code's own MCP session
  tools (see "OpenClaw + Discord coordination" above for the visibility
  scope this needed).
- **Not yet built**: no approval-gate UI for filing (the filer's own
  judgment plus this doc's guidance *is* the control mechanism right now,
  not a per-candidate human approval step) — revisit if the filer's
  judgment turns out to need tightening after seeing more real runs.
- **"Pink" is actually white (2026-08-18)**: originally used 🩷 (pink
  heart) for `recurring-fixed` since Unicode has **no pink circle emoji at
  all** (the colored-circle set only covers red/orange/yellow/green/blue/
  purple/brown/black/white) — 🩷 broke the "all circles" visual language
  the rest of the set has. Owner chose ⚪ (white circle) instead, a real
  circle from the same set. GitHub label color updated to match
  (`#ffffff` — same color the repo's default `wontfix` label already
  uses, so it's a proven-visible choice, not untested).

### Requests tracker (2026-08-18)
A second, parallel tracker for feature/content asks, alongside the issues
one — same mechanics, deliberately simpler (a request either hasn't been
done, is being done, or is done; "recurring" and "can't fix" don't apply
the same way a request does):
- **GitHub**: 3 labels, `request: known` 🔴 / `request: in-progress` 🟡 /
  `request: implemented` 🟢. Never both a `status: *` and `request: *`
  label on the same issue — they're different tracker entries.
- **Discord**: new channel `#requests` (id `1539407172583170190`), routed
  to `issue-filer` via the same binding mechanism as `#issues` (see
  `openclaw config get bindings` — now an array of 2 route entries, both
  `agentId: issue-filer`, differing only in `match.peer.id`).
- `issue-filer` handles both trackers; `issue-hunter` doesn't know about
  requests at all (it only hunts code-side problems).

### issue-filer now reads Q&A directly (2026-08-18)
Per the owner's request, `issue-filer` doesn't just process `issue-hunt`'s
queue anymore — every run it also reads `src/content/qna-pending/*.md`
itself (Phase 0.5 in its skill) and classifies each submission as: a
genuine GTNH question (left untouched, answered normally), a bug report
(→ issues tracker), or a feature/content request (→ requests tracker).
Bug/request submissions get their pending `.md` file deleted once
filed/handled (same precedent as the original missing-space bug from
2026-08-17) — they don't need a Q&A-page answer, they needed a fix or a
tracked ask.

### Condensing + recurring + hard-block detection (2026-08-18)
Added to `issue-file`'s skill, per the owner's request:
- **Condensing**: before filing a new issue, the filer checks whether an
  open issue already covers the *same root cause* at a different
  location (not just exact-title dedup). If so, it edits that issue's
  body into an expandable `<details><summary>📍 Affected locations
  (N)</summary>` checklist instead of creating a duplicate, adding a new
  line for the new location and bumping the count. A single-location
  issue gets converted into this form the moment a second location shows
  up.
- **Recurring** (🔵): the filer independently searches closed
  `status: fixed`/`status: recurring-fixed` issues for a root-cause match
  before deciding `known` vs `recurring` — doesn't just trust
  `issue-hunt`'s suggestion.
- **Hard-block / `workaround`** (🟣): the filer proactively *flags*
  candidates for this status (issues stuck `in-progress` a long time,
  repeated reopens) in its run summary, but does not self-transition to
  `workaround` without confirmation — declaring something unfixable is
  treated as a supervised call, not an autonomous one.

### Exec-boundary hardening: investigated, hit a real architectural wall (2026-08-18)
Tried to turn the hunter→filer boundary from prompt-level (skill
instructions, 100% reliable in every real run so far) into a hard
technical restriction. Two approaches attempted, both dead-ended after
**reading OpenClaw's actual source** (not just guessing from CLI docs):
- **Per-agent exec allowlist** (`openclaw approvals allowlist add --agent
  issue-hunter <path>` + `security: allowlist`): applied it, and it broke
  **everything** for `issue-hunter` — including `git`, which was
  correctly on the allowlist. Root cause, found in
  `claude-live-session-*.js`'s `handleClaudeLiveControlRequest`: for
  agents on the `claude-cli` runtime (all of ours), every native tool
  call is gated by one hardcoded check —
  `security === "full" && ask === "off"` — full stop. The allowlist array
  is never consulted on this path at all; it's for a different exec
  mechanism these agents don't use. **Reverted immediately** back to the
  working state once this broke `git`, not left half-applied.
- **Per-agent GitHub credential** (give the hunter a read-only token so
  `gh issue create` fails on auth even if invoked): no `agents.list[i].env`
  (or equivalent) config path exists to inject a distinct env var per
  agent — confirmed via `config set ... --dry-run` schema rejection, not
  assumption.
- **Conclusion**: for `claude-cli`-backed agents in this OpenClaw version,
  shell exec is all-or-nothing per agent — there's no way to allow `git`/
  `npm`/`grep` while denying `gh` specifically without a platform feature
  that doesn't currently exist. The only way to get a *hard* wall would be
  stripping the hunter's shell access entirely, which would also kill its
  `npm run build`/`grep`/`git log` capability — not an acceptable
  trade-off since those are core to its job. Left as the proven
  prompt-level boundary; revisit if a future OpenClaw version exposes
  finer-grained exec control.

### Gotcha: agent sessions cache their tool list at creation, not live (2026-08-18)
Hit while testing the Q&A monitoring feature: granted `issue-filer` the
`message` tool (`agents.list[i].tools.alsoAllow`), restarted the gateway
multiple times, and it *still* reported `No such tool available: message`
- even though `openclaw config get` showed the grant correctly in place.
Root cause: `openclaw agent --agent issue-filer --message "..."` resumes
the agent's persistent session (`agent:issue-filer:main`) by default, and
that session's available-tools list was fixed when the session was first
created - **restarting the gateway does not create a new session, so it
doesn't pick up new tool grants either.** Fix: pass an explicit fresh
`--session-key` (e.g. `agent:issue-filer:test-$(date +%s)`) to force a
brand-new session, which does pick up current config. Cron-triggered runs
already use `--session isolated` (a fresh session each time), so
**scheduled runs aren't affected by this** - it only bit manual
`openclaw agent` testing/nudging. Also independently set `plugins.allow:
["discord","anthropic"]` (the "auto-loading" plugin warning suggested it)
while debugging this - didn't turn out to be the actual cause, but no
reason to revert it.

### Verified end-to-end test of the new capabilities (2026-08-18)
Created two throwaway test submissions in `qna-pending/` (one bug-shaped,
one request-shaped, both clearly marked "TEST SUBMISSION"). `issue-filer`
correctly classified and filed both to the right tracker with the right
label, deleted both pending files, and (once the session-cache gotcha
above was resolved) posted both to the correct Discord channels. Cleaned
up afterward — deleted both test GitHub issues (`gh issue delete`) and
both test Discord messages, removed their entries from
`btnh-discord-map.json` — so the tracker only reflects real content
(currently just BTNH#1).

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
- **2026-08-17 (later)**: unlinked `/qna` from site nav (still live at its
  direct URL) and set up OpenClaw + Discord coordination for the Q&A
  workflow — see "OpenClaw + Discord coordination" above for the full
  setup, config, and a real gotcha (Discord's "Requires OAuth2 Code
  Grant" toggle silently breaking bot invites) worth not re-discovering.
- **2026-08-18**: wired Claude Code into OpenClaw via gitignored `.mcp.json`
  files (workspace root + this repo) instead of `openclaw attach` directly
  (that needs a real TTY, which this environment doesn't have). Grants are
  capped at 12h server-side; owner chose the refreshable scoped-grant model
  over a permanent standing credential — see "OpenClaw + Discord
  coordination" above. Verified live end-to-end: sent a real Discord DM
  to `@clawed`, confirmed it was received (`openclaw health` showed a new
  session `agent:main:discord:direct:<userId>`) and answered. Default
  session-tools visibility (`tree`) turned out to block reading that
  session at all from the attached MCP grant (`sessions_history` →
  `forbidden`) — fixed by setting `tools.sessions.visibility=agent`
  permanently, since the owner wants full visibility into everything this
  bot does, including a second work-related server planned for later.
- **2026-08-18 (later)**: built the two-agent issue-tracking pipeline
  (`issue-hunter`/`issue-filer`, 6 GitHub status labels, Discord `#issues`
  channel) — see "Issue tracking" above for the full design, a real gotcha
  (new agents lack the `message` tool by default), and end-to-end
  verification (filed and posted BTNH#1 for real). Also upgraded session
  visibility from `agent` to `all` scope, since `agent` scope turned out
  to be per-OpenClaw-agent and couldn't see the new agents' own sessions —
  needed once "everything this bot does" started spanning more than just
  the "main" agent.
- **2026-08-18 (even later)**: added a parallel Requests tracker (3-status,
  own Discord `#requests` channel), gave `issue-filer` direct read access
  to `qna-pending/` so it can classify submissions as bug/request/genuine-
  question on its own, and taught it to condense same-root-cause issues
  from different locations into one expandable checklist instead of
  filing duplicates, independently verify `recurring` status against
  closed-issue history, and proactively flag (not auto-set) `workaround`
  candidates. Investigated hardening the hunter/filer boundary into a real
  technical wall — hit a genuine OpenClaw architectural limit (shell exec
  is all-or-nothing per `claude-cli` agent; no per-agent credential
  scoping exists) after reading the actual source, reverted cleanly when
  the first attempt broke `git` for the hunter. Also found and worked
  around a real gotcha: agent sessions cache their tool list at creation,
  so a new `tools.alsoAllow` grant doesn't reach an already-existing
  session no matter how many times the gateway restarts — needs a fresh
  `--session-key`. Verified the whole new flow live with two throwaway
  test submissions (one bug, one request), then cleaned up all test
  artifacts (GitHub issues, Discord messages, mapping entries).

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
- **The OpenClaw Gateway/Discord bot should already be running** — it's a
  persistent Windows service, not something this session started. See
  "OpenClaw + Discord coordination" above before assuming it needs setup;
  just check status (`openclaw daemon status`) if something seems off.
