import {getCoderByCoinName, getCoderByCoinType} from '@ensdomains/address-encoder';
import {ethers} from 'ethers';

export class Address {
	static from_input(name, s) {
		let coder = getCoderByCoinName(name); // throws
		return new this(coder, s, coder.decode(s));
	}
	static from_raw(type, x) {
		let coder = getCoderByCoinType(type); // throws
		let v = ethers.getBytes(x);
		return new this(coder, coder.encode(v), v);
	}
	constructor(coder, input, bytes) {
		this.coder = coder;
		this.input = input;
		this.bytes = bytes;
	}
	get type() {
		return this.coder.coinType;
	}
}
