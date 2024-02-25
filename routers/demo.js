import fixed from './fixed.js';
import random from './random.js';
import simple from './simple.js';
import flat from './flat.js';
import tree from './tree.js';
import airtable from './airtable.js';
import mirror from './mirror.js';
import coinbase from './coinbase.js';

const routers = [fixed, random, simple, flat, tree, airtable, mirror, coinbase];

// this exposes the other routers as subdomains
// eg. /multi [a.b].(simple).[c.d] => /simple [a.b.c.d]
import {MultiRouter} from '../src/MultiRouter.js';
const multi = new MultiRouter({slug: 'multi', routers});

export const ROUTERS = [...routers, multi];
