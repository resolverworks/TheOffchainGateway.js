
function clock() {
	//return Date.now();
	return performance.now();
}

export class TimedCache {
	constructor() {
		this.map = new Map();
		this.timer = null;
		this.fires = 0 ;
	}
	set(key, value, dur) {
		let {map, fires} = this;
		let exp = clock() + dur;
		if (!map.size || exp < fires) this.restart(exp);
		map.set(key, [exp, value]);
	}
	get(key) {
		return this.map.get(key)?.[1];
	}
	restart(t) {
		clearTimeout(this.timer);
		let now = clock();
		let delay = Math.max(0, t - now) + 50; // clock slop
		this.timer = setTimeout(() => this.clean(), delay).unref();
		this.fires = now + delay;
	}
	clean() {
		let {map} = this;
		let now = clock();
		let min = Infinity;
		for (let [k, [exp]] of map) {
			if (exp <= now) {
				map.delete(k);
			} else if (exp < min) {
				min = exp;
			}
		}
		if (min < Infinity) {
			this.restart(min);
		} else {
			this.fires = 0;
		}
	}
}
