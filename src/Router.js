import {log} from './utils.js';

export class Router {
	static from({slug, ...a}) {
		return Object.assign(new this(slug), a);
	}
	constructor(slug) {
		if (typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) throw new Error('expected basic slug');
		this.slug = slug;
	}
	log(...a) {
		log(`[${this.slug}]`, ...a);
	}
	async fetch_record({name, sender}) {
		throw new Error('missing fetch_record()');
	}
	async init() {
		// do nothing
	}
}
