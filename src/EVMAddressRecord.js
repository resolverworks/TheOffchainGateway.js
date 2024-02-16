import {is_address} from './utils.js';

export class EVMAddressRecord {
	static from(address, type = 60) {
		if (!is_address(address)) throw new Error('expected address');
		return new this(type, address.toLowerCase());	
	}
	constructor(type, address) {
		this.type = type;
		this.address = address;
	}
	addr(type) {
		if (type === this.type) {
			return this.address;
		}
	}
}