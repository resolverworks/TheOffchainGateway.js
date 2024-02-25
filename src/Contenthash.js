import {encode, decode, getCodec} from '@ensdomains/content-hash';
import {ethers} from 'ethers';

// TODO: replace with @adraffy/cid

export class Contenthash {
	static from_raw(x) {
		let hex = ethers.hexlify(x).slice(2);
		let codec = getCodec(hex);
		return new this(codec, Buffer.from(hex, 'hex'));
	}
	static from_parts(codec, s) {
		return new this(codec, Buffer.from(encode(codec, s), 'hex')); // note: this has no 0x
	}
	constructor(codec, bytes) {
		this.codec = codec;
		this.bytes = bytes;
	}
	get input() {
		return decode(this.bytes.toString('hex'));
	}
}
