// SmartCache maintains 2 maps:
// 1) pending promises by key
// 2) settled promises by key + expiration
// requests for the same key return the same promise
// which may be from (1) or (2)
// too many pending {max_pending} are errors
// too many cached {max_cached} purge the oldest
// resolved promises are cached for {ms}
// rejected promises are cached for {ms_error}

const ERR = Symbol();

function clock() {
	return Math.ceil(performance.now());
}

export class SmartCache {
	constructor({ms = 60000, ms_error, ms_slop = 50, max_cached = 10000, max_pending = 100} = {}) {
		this.cached = new Map();
		this.pending = new Map();
		this.timer = undefined;
		this.timer_t = Infinity;
		this.ms_success = ms;
		this.ms_error = ms_error ?? Math.ceil(ms / 4);
		this.ms_slop = ms_slop;
		this.max_cached = max_cached;
		this.max_pending = max_pending;
	}
	_schedule(exp) {
		let now = clock();
		let t = Math.max(now + this.ms_slop, exp);
		//console.log('schedule', {dur: t - now});
		if (this.timer_t < t) return; // scheduled and shorter
		//console.log('restart', {fire: this.timer_t, t});
		clearTimeout(this.timer); // kill old
		this.timer_t = t; // remember fire time
		this.timer = setTimeout(() => {
			let {cached} = this;
			let now = clock();
			let min = Infinity;
			for (let [key, [exp]] of cached) {
				if (exp < now) {
					cached.delete(key);
				} else {
					min = Math.min(min, exp); // find next
				}
			}
			//console.log('fired', {min, n: cached.size});
			this.timer_t = Infinity;
			if (cached.size) {
				this._schedule(min); // schedule for next
			} else {
				clearTimeout(this.timer);
				//console.log('done');
			}
		}, t - now).unref(); // schedule
	}
	add(key, value, ms) {
		if (!ms) ms = this.ms_success;
		let {cached, max_cached} = this;
		if (cached.size >= max_cached) { // we need room
			for (let key of [...cached.keys()].slice(-Math.ceil(max_cached/16))) { // remove batch
				cached.delete(key);
			}
		}
		let exp = clock() + ms;
		cached.set(key, [exp, value]); // add cache entry
		this._schedule(exp);
	}
	get(key, fn, ms) {
		let {cached} = this;
		let p = cached.get(key); // fastpath, check cache
		if (Array.isArray(p)) { 
			let [exp, q] = p;
			if (exp > clock()) return q; // still valid
			cached.remove(key); // expired
		}
		let {pending, max_pending} = this;
		if (pending.size >= max_pending) throw new Error('busy'); // too many in-flight
		p = pending.get(key);
		if (p) return p; // already in-flight
		let q = fn(key); // begin
		p = q.catch(() => ERR).then(x => { // we got an answer
			pending.delete(key); // remove from pending
			this.add(key, q, x && x !== ERR ? ms : this.ms_error); // add original to cache
			return q; // resolve to original
		});
		pending.set(key, p); // remember in-flight
		return p; // return original
	}
}
