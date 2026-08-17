// GITHUB_TOKEN is a secret (set via `wrangler secret put` / `.dev.vars`),
// so it isn't declared in wrangler.jsonc and doesn't show up in the
// generated worker-configuration.d.ts. Augment it here instead. The
// `cloudflare:workers` module's `env` export (see src/pages/api/qna/submit.ts)
// is typed against the global Env interface, not Cloudflare.Env.
interface Env {
	GITHUB_TOKEN: string;
}
