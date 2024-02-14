import {encode as encodeContentHash} from '@ensdomains/content-hash';
import {bytes32_from} from './utils.js';
import {Address} from './Address.js';

export class Record extends Map {
	static from_json(json) {
		let self = new this();
		for (let [k, v] of Object.entries(json)) {
			self.put(k, v);
		}
		return self;
	}
	put(k0, v) {
		// stores:
		// * text(key)     == [string: string]
		// * addr(type)    == [$name: Address]
		// * contenthash() == [Record.CONTENTHASH: {input, codec, bytes}] 
		// * pubkey()      == [Record.PUBKEY: [x, y]]
		let k = k0;
		try {
			if (k.startsWith('$')) {
				v = Address.from_input(k.slice(1), v); // throws
				k = v.type;
			} else if (k === Record.PUBKEY) {
				v = [bytes32_from(v.x), bytes32_from(v.y)];
			} else if (k.startsWith('#')) {
				let codec = k.slice(1);
				v = {
					input: v,
					codec,
					bytes: Buffer.from(encodeContentHash(codec, v), 'hex') // note: this has no 0x
				};
				k = Record.CONTENTHASH;
			}
			this.set(k, v);
		} catch (err) {
			throw new Error(`Storing "${k0}": ${err.message}`, {cause: err});
		}
	}
	text(key) {
		return this.get(key);
	}
	addr(type) {
		return this.get(type)?.bytes;
	}
	contenthash() {
		return this.get(Record.CONTENTHASH)?.bytes;
	}
	pubkey() {
		return this.get(Record.PUBKEY);
	}
	toJSON() {
		return Object.fromEntries([...this].map(([k, v]) => {
			if (k === Record.CONTENTHASH) {
				k = `#${v.codec}`;
				v = v.input;
			} else if (k === Record.PUBKEY) {
				let [x, y] = v;
				v = {x, y};
			} else if (v instanceof Address) {
				k = `$${v.coder.name}`;
				v = v.input;
			}
			return [k, v];
		}));
	}
}
Object.defineProperty(Record, 'CONTENTHASH', {
	value: '#contenthash',
	writable: false,
	configurable: false,
});
Object.defineProperty(Record, 'PUBKEY', {
	value: '#pubkey',
	writable: false,
	configurable: false,
});