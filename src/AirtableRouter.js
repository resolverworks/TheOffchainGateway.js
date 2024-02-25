import {Router} from './Router.js';
import {Record} from './Record.js';
import {SmartCache} from './SmartCache.js';

const NAME_FIELD = 'name';
const ADDR60_FIELD = 'address';

export class AirtableRouter extends Router {
	constructor({slug, secret, base, dur = 10000}) {
		super(slug);
		this.secret = secret;
		this.base = base;
		this.cache = new SmartCache();
		this.dur = dur;
	}
	async fetch_record({name}) {
		return this.cache.get(name, this.dur, x => this.lookup(x));
	}
	async lookup(name) {
		let url = new URL(`https://api.airtable.com/v0/${this.base}/records`);
		url.searchParams.set('maxRecords', 1);
		url.searchParams.append('fields[]', ADDR60_FIELD);
		url.searchParams.set('filterByFormula', `{${NAME_FIELD}}='${name}'`);
		let res = await fetch(url, {
			headers: {authorization: `Bearer ${this.secret}`}
		});
		if (!res.ok) throw new Error(`Airtable HTTP ${res.status}`); // TODO
		let {records} = await res.json();
		if (records.length) {
			let [{fields: {address}}] = records;
			this.log(`Found: ${name} = ${address}`);
			return Record.from({$eth: address});
		}
	}
}

