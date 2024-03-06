
// all of these are optional
const routers = [
	(await import('./routers/fixed.js')).default,
	(await import('./routers/random.js')).default,
	(await import('./routers/simple.js')).default,
	(await import('./routers/flat.js')).default,
	(await import('./routers/tree.js')).default,
	(await import('./routers/airtable.js')).default,
	(await import('./routers/mirror.js')).default,
	(await import('./routers/coinbase.js')).default,
	(await import('./routers/wikipedia.js')).default,
	(await import('./routers/github.js')).default,
	(await import('./routers/reverse.js')).default,
	(await import('./routers/teamnick.js')).default,
];

// requires postgres server
if (process.env.NAMESTONE_PG) {
	routers.push((await import('./routers/namestone-pg.js')).default);
}

// (optional) this exposes the other routers as subdomains
// this makes it easy to serve all the demos from one endpoint
// eg. /multi [a.b].(simple).[c.d] => /simple [a.b.simple.c.d]
import {MultiRouter} from './src/MultiRouter.js';
const multi = new MultiRouter({slug: 'multi', routers});

export const ROUTERS = [...routers, multi];
