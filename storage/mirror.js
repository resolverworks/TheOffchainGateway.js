// mirror "a.b.c" as "a.eth"

import {ethers} from 'ethers';

const provider = new ethers.CloudflareProvider();

class Mirror {
	constructor(name) {
		this.name = name;
	}
	async addr(type) {
		if (type === 60) {
			return provider.resolveName(this.name);
		}
	}
}

export function fetch_record({labels}) {
	return new Mirror(`${labels[0]}.eth`);
}
