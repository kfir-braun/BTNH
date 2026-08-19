import { TIERS } from './tiers';

function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const STOPS = TIERS.map((t) => hexToRgb(t.color));

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

// WCAG relative luminance + contrast ratio.
function relativeLuminance(r: number, g: number, b: number): number {
	const [rl, gl, bl] = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(l1: number, l2: number): number {
	const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
	return (a + 0.05) / (b + 0.05);
}

const LIGHT_TEXT_LUM = relativeLuminance(0xf2, 0xf2, 0xf5);
const DARK_TEXT_LUM = relativeLuminance(0x15, 0x15, 0x1a);

// Deciding "light or dark text" by comparing background luminance to a flat
// 0.5 midpoint is wrong here: LIGHT_TEXT_LUM sits much closer to white than
// DARK_TEXT_LUM sits to black, so the actual contrast crossover is well
// below 0.5 - a naive threshold picked light text (and contrast ratios as
// low as ~1.8:1, under WCAG AA's 4.5:1) for several of the mid-brightness
// tiers (MV, HV, EV, LuV, UHV). Compare both real contrast ratios instead
// and pick whichever wins - verified against all 9 tier stops (2026-08-19)
// before shipping this, not just eyeballed.
function pickTextIsDark(bgLuminance: number): boolean {
	return contrastRatio(bgLuminance, DARK_TEXT_LUM) >= contrastRatio(bgLuminance, LIGHT_TEXT_LUM);
}

export function initTierScroll(): void {
	const body = document.body;
	let ticking = false;

	function update() {
		const scrollable = document.documentElement.scrollHeight - window.innerHeight;
		const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
		const segment = progress * (STOPS.length - 1);
		const idx = Math.min(Math.floor(segment), STOPS.length - 2);
		const t = segment - idx;
		const [r1, g1, b1] = STOPS[idx];
		const [r2, g2, b2] = STOPS[idx + 1];
		const r = Math.round(lerp(r1, r2, t));
		const g = Math.round(lerp(g1, g2, t));
		const b = Math.round(lerp(b1, b2, t));

		body.style.setProperty('--scroll-bg', `rgb(${r}, ${g}, ${b})`);

		const useDarkText = pickTextIsDark(relativeLuminance(r, g, b));
		body.style.setProperty('--scroll-fg', useDarkText ? '#15151a' : '#f2f2f5');
		body.style.setProperty('--scroll-fg-dim', useDarkText ? '#3a3a42' : '#c7c7cf');
		body.style.setProperty('--scroll-link', useDarkText ? '#1d4ed8' : '#8ab4ff');
		body.style.setProperty(
			'--scroll-border',
			useDarkText ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)',
		);
	}

	function onScroll() {
		if (!ticking) {
			requestAnimationFrame(() => {
				update();
				ticking = false;
			});
			ticking = true;
		}
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll);
	update();
}
