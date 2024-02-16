import {TimedCache} from './TimedCache.js';

export class SmartCache {
	constructor() {
		this.active = new Map();
		this.cached = new TimedCache();
	}
	async get(key, dur, generator) {
		let p = this.active.get(key); 
		if (p) return p;
		let res = this.cached.get(key);
		if (res === undefined) {
			p = generator(key).catch(x => x).then(x => {
				this.active.delete(key);
				this.cached.set(key, x, dur);
				return x;
			});
			this.active.set(key, p);
			res = await p;
		}
		if (res instanceof Error) {
			throw res;
		} else {
			return res;
		}
	}
}
