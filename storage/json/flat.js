// load flat.json once, assume {name: address}, no features

import {readFileSync} from 'node:fs';

let names = JSON.parse(readFileSync(new URL('./flat.json', import.meta.url)));

export async function fetch_record({name}) {
	let address = names[name];
	if (address) return {
		addr(type) {
			if (type === 60) return address;
		}
	};
}
