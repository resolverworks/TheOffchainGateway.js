import {EVMAddressRecord} from '../utils/EVMAddressRecord.js';
import {SmartCache} from '../utils/SmartCache.js';
import {Router} from '../utils/Router.js';

const NAME_FIELD = 'name';
const ADDR60_FIELD = 'address';

export class AirtableRouter extends Router {
	constructor({slug, secret, base}) {
		super(slug);
		this.secret = secret;
		this.base = base;
		this.cache = new SmartCache();
	}
	async fetch_record({name}) {
		return this.cache.get(name, 10000, x => this.lookup(x));
	}
	async lookup(name) {
		let url = new URL(`https://api.airtable.com/v0/${this.base}/records`);
		url.searchParams.set('maxRecords', 1);
		url.searchParams.append('fields[]', ADDR60_FIELD);
		url.searchParams.set('filterByFormula', `{${NAME_FIELD}}='${name}'`);
		let res = await fetch(url, {
			headers: {authorization: `Bearer ${this.secret}`}
		});
		if (!res.ok) throw new Error(`Airtable API: HTTP ${res.status}`);
		let {records} = await res.json();
		if (records.length) {
			let [{fields: {address}}] = records;
			this.log(`${name}: ${address}`);
			return EVMAddressRecord.from(address);
		}
	}
}

