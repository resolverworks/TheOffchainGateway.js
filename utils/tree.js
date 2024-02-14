import {getCoderByCoinName} from '@ensdomains/address-encoder';
import {encode as encodeContentHash} from '@ensdomains/content-hash';
import {split_norm, bytes32_from} from './utils.js';

const KEY_CONTENTHASH = '#contenthash';
const KEY_PUBKEY = '#pubkey';

const LABEL_SELF = '.';

export class Address {
	constructor(coder, input, bytes) {
		this.coder = coder;
		this.input = input;
		this.bytes = bytes;
	}
}

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
		// * contenthash() == [KEY_CONTENTHASH: {input, codec, bytes}] 
		// * pubkey()      == [KEY_PUBKEY: [x, y]]
		let k = k0;
		try {
			if (k.startsWith('$')) {
				let coder = getCoderByCoinName(k.slice(1)); // throws
				v = new Address(coder, v, coder.decode(v));
				k = coder.coinType;
			} else if (k === KEY_PUBKEY) {
				v = [bytes32_from(v.x), bytes32_from(v.y)];
			} else if (k.startsWith('#')) {
				let codec = k.slice(1);
				v = {
					input: v,
					codec,
					bytes: Buffer.from(encodeContentHash(codec, v), 'hex')
				};
				k = KEY_CONTENTHASH;
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
		return this.get(KEY_CONTENTHASH)?.bytes;
	}
	pubkey() {
		return this.get(KEY_PUBKEY);
	}
	toJSON() {
		return Object.fromEntries([...this].map(([k, v]) => {
			if (k === KEY_CONTENTHASH) {
				k = `#${v.codec}`;
				v = v.input;
			} else if (k === KEY_PUBKEY) {
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

export class Node extends Map {
	constructor(label, parent) {
		super();
		if (!parent && !label.startsWith('[')) throw new Error('expected [bracketed] name');
		this.label = label;
		this.parent = parent || null;
		this.rec = null;
		this.hidden = false;
	}
	// get node "a" from "a.b.c" or null
	// find("") is identity
	find(name) {
		return split_norm(name).reduceRight((x, s) => x?.get(s), this);
	}
	// ensures the nodes for "a.b.c" exist and returns "a"
	create(name) {
		return split_norm(name).reduceRight((x, s) => x.ensure_child(s), this);
	}
	// gets or creates a subnode of this node
	ensure_child(label) {
		let node = this.get(label);
		if (!node) {
			node = new Node(label, this);
			this.set(label, node);
		}
		return node;
	}
	import_from_json(json) {
		try {
			if (typeof json !== 'object' || Array.isArray(json)) throw new Error('expected object');
			let rec = json[LABEL_SELF];
			this.rec = Record.from_json(rec || json);
			if (rec) {
				for (let [ks, v] of Object.entries(json)) {
					ks = ks.trim();
					if (!ks || ks === LABEL_SELF) continue;
					for (let k of ks.split(/\s+/)) {
						this.create(k).import_from_json(v);
					}
				}
			}
		} catch (err) {
			throw new Error(`Importing "${this.name}": ${err.message}`, {cause: err});
		}
	}
	toJSON() {
		if (this.rec && !this.size) {
			return this.rec.toJSON();
		}
		let json = {};
		if (this.rec) {
			json[LABEL_SELF] = this.rec.toJSON();
		}
		for (let [k, v] of this) {
			json[k] = v.toJSON();
		}
		return json;
	}
	*find_records() {
		let stack = [this];
		while (stack.length) {
			let node = stack.pop();
			let {rec} = node;
			if (rec) yield rec;
			stack.push(...node.values());
		}
	}
	*find_nodes() {
		let stack = [this];
		while (stack.length) {
			let node = stack.pop();
			stack.push(...node.values());
			yield node;
		}
	}
	get name() {
		if (!this.parent) return this.label;
		let v = [];
		for (let node = this; node.parent; node = node.parent) {
			v.push(node.label);
		}
		return v.join('.');
	}
	print(indent = 0) {
		console.log(`${'  '.repeat(indent)}${this.label}`);
		for (let x of this.values()) {
			if (x.hidden) continue;
			x.print(indent + 1);
		}
	}
}
