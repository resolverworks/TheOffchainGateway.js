import {Record} from '@resolverworks/enson';
import {log, safe_name, SmartCache} from './utils.js';

export class AirtableRouter {
	constructor({slug, secret, base, field = 'name'}) {
		this.slug = slug;
		this.secret = secret;
		this.base = base;
		this.field = field;
		this.cache = new SmartCache();
	}
	async resolve(name) {
		return this.cache.get(name, x => this.lookup(x));
	}
	async lookup(name) {
		log(this.slug, safe_name(name));
		let url = new URL(`https://api.airtable.com/v0/${this.base}/records`);
		url.searchParams.set('maxRecords', 1);
		url.searchParams.set('filterByFormula', `{${this.field}}='${name.replaceAll("'", "\\'")}'`);
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
