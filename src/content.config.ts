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

export const collections = { guides, reference, showcase };
