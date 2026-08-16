// GITHUB_TOKEN is a secret (set via `wrangler secret put` / `.dev.vars`),
// so it isn't declared in wrangler.jsonc and doesn't show up in the
// generated worker-configuration.d.ts. Augment it here instead.
declare namespace Cloudflare {
	interface Env {
		GITHUB_TOKEN: string;
	}
}
