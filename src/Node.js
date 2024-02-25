import {split_norm} from './utils.js';
import {Record} from './Record.js';

const LABEL_SELF = '.';

export class Node extends Map {
	static root(name) {
		return new this(`[${name || 'root'}]`);
	}
	constructor(label, parent) {
		super();
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
			this.rec = Record.from(rec || json);
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
	print(level = 0) {
		console.log(`${'  '.repeat(level)}${this.label}`);
		for (let x of this.values()) {
			if (x.hidden) continue;
			x.print(level + 1);
		}
	}
}
