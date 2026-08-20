// GTNH voltage-tier casing colors, eyeballed from real in-game screenshots
// (owner-provided, 2026-08-19) - not exact pixel values, but representative.
// `texture` is the real casing "side" texture pulled from GregTechRefreshed
// (github.com/ULSTICK/GregTechRefreshed, MIT licensed - credited on the
// Home page footer, see CLAUDE.md "Visual identity" for details), used
// directly as the scrolling background instead of a generated pattern.
// Points at the *mirror-tiled* 32x32 version in casings-mirrored/ (built
// from the raw 16x16 casings/ textures - see CLAUDE.md), not the raw
// texture: repeating the raw 16x16 tile directly reads as an obvious
// repeating grid of little icons, since every tile is byte-identical to its
// neighbor. Mirroring each quadrant makes every adjacent repeat line up
// pixel-for-pixel at the seam, so the background reads as one continuous
// surface instead of a tiled border pattern.
// Order matters: this is the LV -> UHV progression the scroll effect and any
// future tier badges walk through. ULV and Steam are deliberately excluded
// per the owner.
export const TIERS = [
	{ name: 'LV', color: '#34333f', texture: '/textures/casings-mirrored/lv.png' },
	{ name: 'MV', color: '#86a0aa', texture: '/textures/casings-mirrored/mv.png' },
	{ name: 'HV', color: '#b9b7b8', texture: '/textures/casings-mirrored/hv.png' },
	{ name: 'EV', color: '#c9a3c4', texture: '/textures/casings-mirrored/ev.png' },
	{ name: 'IV', color: '#62647a', texture: '/textures/casings-mirrored/iv.png' },
	{ name: 'LuV', color: '#aeadad', texture: '/textures/casings-mirrored/luv.png' },
	{ name: 'ZPM', color: '#4f4fb8', texture: '/textures/casings-mirrored/zpm.png' },
	{ name: 'UV', color: '#c9c7c7', texture: '/textures/casings-mirrored/uv.png' },
	{ name: 'UHV', color: '#b5b3b3', texture: '/textures/casings-mirrored/uhv.png' },
] as const;
