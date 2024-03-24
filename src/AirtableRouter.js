import {Record} from '@resolverworks/enson';
import {asciiize} from '@resolverworks/ezccip';
import {SmartCache} from './SmartCache.js';
import {log} from '../src/utils.js';

export class AirtableRouter {
	constructor({slug, secret, base, field = 'name', dur = 10000}) {
		this.slug = slug;
		this.secret = secret;
		this.base = base;
		this.field = field;
		this.cache = new SmartCache();
		this.dur = dur;
	}
	async resolve(name) {
		return this.cache.get(name, this.dur, x => this.lookup(x));
	}
	async lookup(name) {
		if (name.includes("'")) return; // prevent quote injection
		log(`airtable: ${asciiize(name)}`);
		let url = new URL(`https://api.airtable.com/v0/${this.base}/records`);
		url.searchParams.set('maxRecords', 1);
		url.searchParams.set('filterByFormula', `{${this.field}}='${name}'`);
		let res = await fetch(url, {
			headers: {authorization: `Bearer ${this.secret}`}
		});
		if (!res.ok) throw new Error(`Airtable HTTP ${res.status}`); // TODO
		let {records} = await res.json();
		if (records.length) {
			let {id, createdTime, fields} = records[0];
			fields.notice = `ID(${id}) Created(${createdTime})`;
			return Record.from(fields);
		}
	}
}
