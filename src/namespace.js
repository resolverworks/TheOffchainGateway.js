import {Node, Record} from '@resolverworks/enson';
import {log, error_with} from './utils.js';

// cant decide if this should be a class or just a mixin
export function createNamespace(slug, namespaces) {
	let root = Node.root();
	for (let [name, x] of Object.entries(namespaces)) {
		let node = root.create(name);
		let spaces = node.path().filter(x => x.space);
		if (spaces.length > 1) {
			throw error_with('overlap', {names: spaces.map(x => x.name)});
		}
		parse(node, x);
		node.space = true;
	}
	return {slug, root, resolve};
}

function resolve(name, context, history) {
	let labels = name.split('.');
	let node = this.root;
	let space;
	let base;
	// traverse the name right to left: a.b.[c] => a.[b.c] => [a.b.c]
	for (let i = labels.length-1; i >= 0; i--) {
		node = node.get(labels[i]);
		if (!node) break;
		if (node.space) space = node; // we hit a space
		if (node.wild) base = node; // remember
	}
	if (!space) return; // no space
	if (node) { // we found a node...
		let {record} = node;
		if (record) { // ...with a record
			return is_fn(record) ? record(name, context) : record;
		}
	}
	if (base) { // send remainder of name to wildcard
		let {wild} = base;
		if (!base.offset) {
			if (typeof wild === 'string') { // dynamic link because router load order is undefined
				wild = context.routers.get(base.wild);
			}
			wild = try_resolvable(wild);
			if (!wild) {
				log(`Unknown wildcard: ${base.name}`); // only shown once
				delete base.wild; // unlink
				return;
			}
			base.wild = wild;
			base.offset = labels.slice(-base.depth).reduce((a, x) => a + x.length + 1, 0);
		}
		context.space = space;
		context.base = base;
		let rest = name.slice(0, -base.offset);
		return base.wild(rest, context, history);
	}
}

function parse(node, space) {
	if (!space) throw error_with('expected space', {name: node.name});
	if (space instanceof Record) { // already parsed
		node.record = space;
		return;
	} else if (typeof space === 'string') { // router by name
		node.wild = space;
		return;
	}
	let resolve = try_resolvable(space); // router instance or inline resolve() function
	if (resolve) {
		node.wild = resolve;
		return;
	}
	let {['*']: wild, ['.']: record, ...rest} = space;
	if (!record && !wild) {
		node.record = dynamic_record(space);
		return;
	}
	if (wild) {
		node.wild = wild;
	}
	if (record) {
		node.record = dynamic_record(record);
	}
	for (let [ks, v] of Object.entries(rest)) {
		ks = ks.trim();
		if (!ks) throw error_with('expected label', {name: node.name});
		for (let k of ks.split(/\s+/)) {
			parse(node.create(k), v);
		}
	}
}

function try_resolvable(x) {
	if (typeof x === 'object' && is_fn(x.resolve)) { // router
		return x.resolve.bind(x);
	} else if (is_fn(x)) { // inline resolve() function
		return x;
	}
}

function dynamic_record(x) {
	if (is_fn(x)) return x; // single record generator
	if (Object.values(x).some(is_fn)) { // dynamic records
		return async (...a) => {
			let m = Object.entries(x);
			let v = await Promise.allSettled(m.map(async ([_, x]) => is_fn(x) ? x(...a) : x));
			return Record.from(m.map(([k], i) => [k, v[i].value]));
		};
	} 
	return Record.from(x);
}

function is_fn(x) {
	return typeof x === 'function';
}
