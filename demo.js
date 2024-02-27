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

// this exposes the other routers as subdomains
// eg. /multi [a.b].(simple).[c.d] => /simple [a.b.c.d]
import {MultiRouter} from './src/MultiRouter.js';
const multi = new MultiRouter({slug: 'multi', routers});

export const ROUTERS = [...routers, multi];
