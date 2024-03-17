
export default {
	slug: 'tunnel',
	init(ezccip) {
		// https://adraffy.github.io/keccak.js/test/demo.html#algo=evm&s=fetchFlatJSON%28string%29&escape=1&encoding=utf8
		ezccip.register('fetchFlatJSON(string url) returns (tuple(string, string)[])', handle); // 0xe81d0c1c
	}
}

// note: this is a somewhat dangerous, as this is an open proxy, but it is cool tech demo
async function handle([url], context, history) {
	url = new URL(url); // must validate
	if (!/^https?:$/.test(url.protocol)) throw new Error('expected http');
	let ac = new AbortController();
	let res = fetch(url, {signal: ac.signal});
	let timer = setTimeout(() => ac.abort('timeout'), 10000);
	res = await res;
	clearTimeout(timer);
	return [flat_json(await res.json())];
}

export function flat_json(json) {
	let flat = [];
	build(json, []);	
	return flat;
	function build(x, path) {
		if (x && typeof x === 'object') {
			let n = path.length;
			for (let [k, v] of Object.entries(x)) {
				path[n] = k;
				build(v, path);
			}
			path.length = n;
		} else {
			flat.push([path.join('.'), String(x)]);
		}
	}
}
