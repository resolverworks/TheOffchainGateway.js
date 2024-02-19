import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {SmartCache} from '../src/SmartCache.js';
import {ethers} from 'ethers';
import {log, nth_label} from '../src/utils.js';

const cache = new SmartCache();

async function fetch_rates() {
	log('Reloading Coinbase Rates');
	let {data: {rates}} = await fetch('https://api.coinbase.com/v2/exchange-rates').then(r => r.json());
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
		if (price) return Record.from({
			name: `$${price.toLocaleString(undefined, {minimumFractionDigits: 2})}`,
			description: `Pulled at ${rates.t}`,
			avatar: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/32%402x/color/${tick}@2x.png`
		});
	}
});
