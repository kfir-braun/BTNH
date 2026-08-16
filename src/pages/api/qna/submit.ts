import type { APIRoute } from 'astro';

export const prerender = false;

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
}

function toFrontmatterYaml(question: string, askedAt: string): string {
	// Single-line values only here, so escaping double quotes is sufficient.
	const escaped = question.replace(/"/g, '\\"');
	return `---\nquestion: "${escaped}"\naskedAt: '${askedAt}'\n---\n`;
}

export const POST: APIRoute = async ({ request, locals }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
	}

	const { question, website } = (body ?? {}) as { question?: unknown; website?: unknown };

	// Honeypot: a hidden field real visitors never fill in. Bots that
	// blindly fill every form field trip this.
	if (typeof website === 'string' && website.trim() !== '') {
		return new Response(JSON.stringify({ error: 'Rejected' }), { status: 400 });
	}

	if (typeof question !== 'string') {
		return new Response(JSON.stringify({ error: 'question is required' }), { status: 400 });
	}

	const trimmed = question.trim();
	if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
		return new Response(
			JSON.stringify({ error: `question must be between ${MIN_LENGTH} and ${MAX_LENGTH} characters` }),
			{ status: 400 },
		);
	}

	const env = locals.runtime.env;
	const askedAt = new Date().toISOString().slice(0, 10);
	const slug = `${askedAt}-${slugify(trimmed) || 'question'}-${Date.now().toString(36)}`;
	const path = `src/content/qna-pending/${slug}.md`;
	const content = toFrontmatterYaml(trimmed, askedAt);

	const res = await fetch(
		`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${env.GITHUB_TOKEN}`,
				'User-Agent': 'btnh-qna-worker',
				Accept: 'application/vnd.github+json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				message: `Q&A: new question ${slug}`,
				content: btoa(unescape(encodeURIComponent(content))),
				branch: env.GITHUB_BRANCH,
			}),
		},
	);

	if (!res.ok) {
		const detail = await res.text();
		console.error('GitHub commit failed', res.status, detail);
		return new Response(JSON.stringify({ error: 'Could not submit question, try again later' }), {
			status: 502,
		});
	}

	return new Response(JSON.stringify({ ok: true }), {
		status: 201,
		headers: { 'Content-Type': 'application/json' },
	});
};
