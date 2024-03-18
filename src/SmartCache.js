import {TimedCache} from './TimedCache.js';

// SmartCache is a TimedCache with resolved promise results
// and an additional map with pending promises
// keyed input will return the same pending promise, while active
// (which prevents duplicate inflight requests)
// and return the same resolved result, until expired
// the expectation is that:
// * success is not an instanceof Error
// * error is an instance of Error
// although any values work if they can be distinguished

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
