// GTNH voltage-tier casing colors, eyeballed from real in-game screenshots
// (owner-provided, 2026-08-19) - not exact pixel values, but representative.
// Order matters: this is the LV -> UHV progression the scroll effect and any
// future tier badges walk through. ULV and Steam are deliberately excluded
// per the owner.
export const TIERS = [
	{ name: 'LV', color: '#34333f' },
	{ name: 'MV', color: '#86a0aa' },
	{ name: 'HV', color: '#b9b7b8' },
	{ name: 'EV', color: '#c9a3c4' },
	{ name: 'IV', color: '#62647a' },
	{ name: 'LuV', color: '#aeadad' },
	{ name: 'ZPM', color: '#4f4fb8' },
	{ name: 'UV', color: '#c9c7c7' },
	{ name: 'UHV', color: '#b5b3b3' },
] as const;
