import {Address} from './Address.js';
import {Contenthash} from './Contenthash.js';

export class Record extends Map {
	static from(json) {
		let self = new this();
		for (let [k, v] of Object.entries(json)) {
			self.put(k, v);
		}
		return self;
	}
	put(k0, v) {
		// accepts:
		// * "name" => as-is
		// * "$coin" => human-readable address
		// * "#{ipns|ipfs...}" => human-readable contenthash()
		// * "#contenthash" => pre-encoded contenthash()
		// * "#pubkey" => {x, y}
		// stores:
		// * text(key)     == [string: string] 
		// * addr(type)    == [$name: Address]
		// * contenthash() == [Record.CONTENTHASH: Contenthash] 
		// * pubkey()      == [Record.PUBKEY: [x, y]]
		let k = k0;
		try {
			if (k.startsWith('$')) {
				v = Address.from_input(k.slice(1), v); // throws
				k = v.type;
			} else if (k === Record.NAME) {
				// do nothing
			} else if (k === Record.PUBKEY) {
				v = {x: BigInt(v.x), y: BigInt(v.y)};
			} else if (k === Record.CONTENTHASH) {
				v = Contenthash.from_raw(v);
			} else if (k.startsWith('#')) {
				v = Contenthash.from_parts(k.slice(1), v);
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
	name() {
		return this.get(Record.NAME);
	}
	toJSON() {
		return Object.fromEntries([...this].map(([k, v]) => {
			if (k === Record.CONTENTHASH) {
				k = `#${v.codec}`;
				v = v.input;
			} else if (v instanceof Address) {
				k = `$${v.coder.name}`;
				v = v.input;
			}
			return [k, v];
		}));
	}
}
define('CONTENTHASH');
define('PUBKEY');
define('NAME');
function define(key, val) {
	Object.defineProperty(Record, key, {
		value: `#${val || key.toLowerCase()}`,
		writable: false,
		configurable: false,
	});
}