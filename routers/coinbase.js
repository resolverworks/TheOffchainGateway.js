import {Record} from '@resolverworks/enson';
import {SmartCache} from '../src/SmartCache.js';
import {log} from '../src/utils.js';
import {ethers} from 'ethers';

const cache = new SmartCache();

const RATES_URL = 'https://api.coinbase.com/v2/exchange-rates';

async function fetch_rates() {
	log('coinbase: fetch_rates()');
	let {data: {rates}} = await fetch(RATES_URL).then(r => r.json());
	let map = new Map();
	map.t = new Date().toISOString();
	for (let [k, v] of Object.entries(rates)) {
		try {
			map.set(ethers.ensNormalize(k), 1 / parseFloat(v));
		} catch (err) {
			//console.log('coinbase: invalid ticker:', k, err); // rare
		}
	}
	return map;
}

export default {
	slug: 'coinbase',
	async resolve(name) {
		let rates = await cache.get('RATES', 30000, fetch_rates);
		if (!name) {
			return Record.from({
				name: 'Coinbase API over ENS',
				notice: `${rates.size.toLocaleString()} symbols`,
				description: [...rates.keys()].join(' '),
				url: RATES_URL,
			});
		}
		let price = rates.get(name);
		let rel = name === 'eth' ? 'BTC' : 'ETH';
		if (price) {
			return Record.from({
				name: `$${format_price(price)} — ${format_price(price / rates.get(rel.toLowerCase()))} per ${rel}`,
				description: `As of ${rates.t}`,
				avatar: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32%402x/color/${name}@2x.png`,
				url: `https://www.coinbase.com/price/${name}`,
			});
		}
	}
}

// make fancy degen price
export function format_price(p, n = 4) {
	if (p > 100) n = 2;
	if (p >= 1) return p.toLocaleString(undefined, {minimumFractionDigits: n, maximumFractionDigits: n});
	let [dec, exp] = p.toExponential(n-1).split('e-');
	exp = parseInt(exp);
	return exp >= 4 ? `0.0${sub_digit(exp)}${dec.replace('.', '')}` : p.toFixed(exp+n-1);
}
function sub_digit(i) {
	return (i < 10 ? '' : sub_digit(Math.floor(i / 10))) + String.fromCodePoint(0x2080 + (i % 10));
}
