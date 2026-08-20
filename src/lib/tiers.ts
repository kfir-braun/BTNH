// GTNH voltage-tier casing colors, eyeballed from real in-game screenshots
// (owner-provided, 2026-08-19) - not exact pixel values, but representative.
// `texture` is the real casing "side" texture pulled from GregTechRefreshed
// (github.com/ULSTICK/GregTechRefreshed, MIT licensed - credited on the
// Home page footer, see CLAUDE.md "Visual identity" for details), used
// directly as the scrolling background instead of a generated pattern.
// Points at the *zoomed* 10x10 crop in casings-zoomed/ (built from the raw
// 16x16 casings/ textures - see CLAUDE.md), not the raw texture: the raw
// texture has a distinctly darker 2-3px border/bevel framing each tile,
// which reads as a hard grid line every time it repeats. Cropping that
// border off and tiling just the interior reads as one continuous casing
// instead of a grid of bordered tiles.
// Order matters: this is the LV -> UHV progression the scroll effect and any
// future tier badges walk through. ULV and Steam are deliberately excluded
// per the owner.
export const TIERS = [
	{ name: 'LV', color: '#34333f', texture: '/textures/casings-zoomed/lv.png' },
	{ name: 'MV', color: '#86a0aa', texture: '/textures/casings-zoomed/mv.png' },
	{ name: 'HV', color: '#b9b7b8', texture: '/textures/casings-zoomed/hv.png' },
	{ name: 'EV', color: '#c9a3c4', texture: '/textures/casings-zoomed/ev.png' },
	{ name: 'IV', color: '#62647a', texture: '/textures/casings-zoomed/iv.png' },
	{ name: 'LuV', color: '#aeadad', texture: '/textures/casings-zoomed/luv.png' },
	{ name: 'ZPM', color: '#4f4fb8', texture: '/textures/casings-zoomed/zpm.png' },
	{ name: 'UV', color: '#c9c7c7', texture: '/textures/casings-zoomed/uv.png' },
	{ name: 'UHV', color: '#b5b3b3', texture: '/textures/casings-zoomed/uhv.png' },
] as const;
