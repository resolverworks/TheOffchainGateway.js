import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {SmartCache} from '../src/SmartCache.js';
import {ethers} from 'ethers';
import {log, nth_label} from '../src/utils.js';

const cache = new SmartCache();

const RATES_URL = 'https://api.coinbase.com/v2/exchange-rates';

async function fetch_rates() {
	log('Reloading Coinbase Rates');
	let {data: {rates}} = await fetch(RATES_URL).then(r => r.json());
	let map = new Map();
	map.t = new Date().toISOString();
	for (let [k, v] of Object.entries(rates)) {
		try {
			map.set(ethers.ensNormalize(k), 1 / parseFloat(v));
		} catch (err) {
			console.log('Invalid ticker:', k, err);
		}
	}
	return map;
}

export default Router.from({
	slug: 'coinbase',
	async fetch_record({name}) {
		let rates = await cache.get('RATES', 60000, fetch_rates);
		let tick = nth_label(name);
		let price = rates.get(tick);
		let rel = tick === 'eth' ? 'BTC' : 'ETH';
		if (price) {
			return Record.from({
				name: `$${format_price(price)} — ${format_price(price / rates.get(rel.toLowerCase()))} per ${rel}`,
				description: `As of ${rates.t}`,
				avatar: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32%402x/color/${tick}@2x.png`,
				url: `https://www.coinbase.com/price/${tick}`,
			});
		} else if (tick === 'coinbase') { // hack for index
			return Record.from({
				name: 'Coinbase API over ENS',
				notice: `${rates.size.toLocaleString()} symbols`,
				description: [...rates.keys()].join(' '),
				url: RATES_URL,
			});
		}
	}
});


// make fancy degen price
function format_price(p, n = 4) {
	if (p > 100) n = 2;
	if (p >= 1) return p.toLocaleString(undefined, {minimumFractionDigits: n, maximumFractionDigits: n});
	let [dec, exp] = p.toExponential(n-1).split('e-');
	exp = parseInt(exp);
	return exp >= 4 ? `0.0${sub_digit(exp)}${dec.replace('.', '')}` : p.toFixed(exp+n-1);
}
function sub_digit(i) {
	return (i < 10 ? '' : sub_digit(Math.floor(i / 10))) + String.fromCodePoint(0x2080 + (i % 10));
}

// for (let i = -3; i < 10; i++) {
// 	let p = 1.23 * (10 ** -i);
// 	console.log(format_price(p));
// }