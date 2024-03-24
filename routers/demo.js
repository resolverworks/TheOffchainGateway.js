// all of these are optional
export default [
	(await import('./fixed.js')).default,
	(await import('./random.js')).default,
	(await import('./simple.js')).default,
	(await import('./flat.js')).default,
	(await import('./tree.js')).default,
	(await import('./airtable.js')).default,
	(await import('./mirror.js')).default,
	(await import('./coinbase.js')).default,
	(await import('./wikipedia.js')).default,
	(await import('./github.js')).default,
	(await import('./reverse.js')).default,
	(await import('./teamnick.js')).default,
	(await import('./tunnel.js')).default,
	(await import('./farcaster.js')).default,
];
