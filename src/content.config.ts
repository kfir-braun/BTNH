import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const guides = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
	schema: z.object({
		title: z.string(),
		section: z.enum(['layouts', 'infrastructure', 'aesthetics', 'efficiency']),
		description: z.string(),
		voltageTier: z.string().optional(),
	}),
});

const reference = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/reference' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
	}),
});

const showcase = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/showcase' }),
	schema: z.object({
		title: z.string(),
		builder: z.string(),
		description: z.string(),
	}),
});

const qna = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/qna' }),
	schema: z.object({
		question: z.string(),
		askedAt: z.string(),
		answeredAt: z.string(),
	}),
});

// Inbox of submitted-but-not-yet-answered questions, written here by the
// /api/qna/submit Worker endpoint via a GitHub commit. Never rendered as
// public pages — see getStaticPaths guards on the qna pages. Answering a
// question means moving its file from here into src/content/qna/ with an
// `answer` body added, then committing.
const qnaPending = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/qna-pending' }),
	schema: z.object({
		question: z.string(),
		askedAt: z.string(),
	}),
});

export const collections = { guides, reference, showcase, qna, qnaPending };
