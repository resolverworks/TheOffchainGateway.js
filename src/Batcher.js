import {TimedCache} from './TimedCache.js';

export class Batcher {
	constructor({
		// max ms to wait for additional requests before calling batch()
		ms_bucket = 50, 
		// max number of pending requests before calling batch(),
		max = 100, 
		// if true, stores value/undefined instead of promise
		unwrap = false,
		// ms to cache result if successful
		ms_ok = 30000, 
		// ms to cache result if failed
		ms_error = 5000,
		// function to convert add(item) to a key, eg. some kind of hash
		key,
		// function to process a batch of {item, callback}[]
		// where callback is (success: bool, value: any) => void
		batch
	}) {
		if (!Number.isInteger(ms_bucket) || ms_bucket < 1) throw new Error('ms_bucket must be > 0');
		if (!Number.isInteger(max) || max < 1) throw new Error('max must be > 0');
		this.ms_bucket = ms_bucket;
		this.max = max;
		this.unwrap = unwrap;
		this.ms_ok = ms_ok;
		this.ms_error = ms_error;
		this.cache = new TimedCache();
		this.pending = new Map();
		this.queue = undefined;
		this.timer = undefined;
		this.key_fn = key;
		this.batch_fn = batch;
	}
	add(item) {
		let key = this.key_fn(item); // convert the request to a hash
		let temp = this.cache.get(key); // check if already cached
		if (temp) return temp[1]; // was cached
		let p = this.pending.get(key); // check if inflight
		if (p) return p; // was inflight
		if (this.queue && this.queue.length >= this.max) { // check if batch is full
			clearTimeout(this.timer);
			this.batch_fn(this.queue); // process it
			this.queue = undefined; // reset
		}
		if (!this.queue) { // create a new batch
			this.queue = [];
			this.timer = setTimeout(() => {
				this.batch_fn(this.queue);
				this.queue = undefined;
			}, this.ms_bucket).unref(); // start a timer to process it
		}
		let ful, rej;
	 	p = new Promise((f, r) => {
			ful = f;
			rej = r;
		});
		this.pending.set(key, p); // mark as inflight
		this.queue.push({ // add to bucket
			item,
			callback: (ok, value) => {
				this.pending.delete(key);
				if (this.unwrap && !ok) value = undefined;
				this.cache.set(key, this.unwrap ? value : p, ok ? this.ms_ok : this.ms_error);
				if (this.unwrap || ok) {
					ful(value);
				} else {
					rej(value);
				}
			}
		});
		return p;
	}
}
