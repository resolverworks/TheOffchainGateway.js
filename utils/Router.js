import {log} from './utils.js';

export class Router {
	static root(r) {
		if (!r.fetch_root) {
			throw new Error('fetch_root() not supported');
		}
		return r.fetch_root();
	}
	constructor(slug) {
		this.slug = slug;
	}
	get path() {
		return `/${this.slug}/`;
	}
	log(...a) {
		log(this.path, ...a);
	}
	async fetch_record({name, labels, sender}) {
		throw new Error('missing fetch_record() impl');
	}
	// async fetch_root() {
	// 	
	// }
}