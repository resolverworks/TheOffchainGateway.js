import {Address, $coin} from './Address.js';
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
		// * "text" => string, unmodified
		// * "$coin" => human-readable address
		// * "#{ipns|ipfs...}" => human-readable contenthash()
		// * "#contenthash" => pre-encoded contenthash()
		// * "#pubkey" => {x, y}
		// * "#name" => string, unmodified (TODO: enforce normalization?)
		// stores:
		// * text(key)     == [string: string] 
		// * addr(type)    == [$name: Address]
		// * contenthash() == [Record.CONTENTHASH: Contenthash] 
		// * pubkey()      == [Record.PUBKEY: [x, y]]
		// * name()        == [Record.NAME: string]
		let k = k0;
		try {
			if (k.startsWith('$')) {
				if (v) {
					v = Address.from_input(k.slice(1), v);
					k = v.type;
				} else {
					k = $coin({name: k.slice(1)}).coinType;
				}
			} else if (k === Record.NAME) {
				// do nothing
			} else if (k === Record.PUBKEY) {
				if (v) v = {x: BigInt(v.x), y: BigInt(v.y)};
			} else if (k === Record.CONTENTHASH) {
				if (v) v = Contenthash.from_raw(v);
			} else if (k.startsWith('#')) {
				if (v) v = Contenthash.from_parts(k.slice(1), v);
				k = Record.CONTENTHASH;
			}
			if (v) {
				this.set(k, v);
			} else {
				this.delete(k);
			}
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
			if (v instanceof Address) {
				k = `$${v.coder.name}`;
				v = v.input;
			} else if (k === Record.CONTENTHASH) {
				k = `#${v.codec}`;
				v = v.input;
			} else if (k === Record.PUBKEY) {
				v = {
					x: json_big_int(v.x),
					y: json_big_int(v.y)
				};
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

function json_big_int(x) {
	return '0x' + BigInt(x).toString(16).padStart(64, '0'); // TODO: reduce 0 padding
}
