import {getCoderByCoinType, coinNameToTypeMap} from '@ensdomains/address-encoder';
import {ethers} from 'ethers';

const cache = new Map();

export function $coin({type, name, evm}) {
	if (name) {
		type = coinNameToTypeMap[name];
	} else if (typeof evm === 'number') {
		type = evm + 0x80000000;
	}
	if (typeof type !== 'number') throw new Error('unable to derive coin codec');
	let coder = cache.get(type);
	if (!coder) {
		coder = getCoderByCoinType(type);
		cache.set(type, coder);
	}
	return coder;
}

export class Address {
	static from_input(name, s) {
		let coder = $coin({name});
		return new this(coder, coder.decode(s));
	}
	static from_raw(type, x) {
		let coder = $coin({type});
		return new this(coder, Buffer.from(ethers.getBytes(x)));
	}
	constructor(coder, bytes) {
		this.coder = coder;
		this.bytes = bytes;
	}
	get input() {
		return this.coder.encode(this.bytes);
	}
	get type() {
		return this.coder.coinType;
	}
}
