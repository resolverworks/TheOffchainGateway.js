import fixed from './routers/fixed.js';
import random from './routers/random.js';
import simple from './routers/simple.js';
import flat from './routers/flat.js';
import tree from './routers/tree.js';
import airtable from './routers/airtable.js';
import mirror from './routers/mirror.js';
import coinbase from './routers/coinbase.js';
import wikipedia from './routers/wikipedia.js';
import github from './routers/github.js';
import reverse from './routers/reverse.js';

// all of these are optional
const routers = [
	fixed, 
	random, 
	simple, 
	flat, 
	tree, 
	airtable, 
	mirror, 
	coinbase, 
	wikipedia, 
	github,
	reverse
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
