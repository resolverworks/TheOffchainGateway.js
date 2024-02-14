import {readFile} from 'node:fs/promises';
import {watch} from 'node:fs';
import {log} from '../../utils/utils.js';
import {Node, Record} from '../../utils/tree.js';

const DB_FILE = new URL('./tree.json', import.meta.url);

function log_db(...a) {
	log(`[${DB_FILE.pathname}]`, ...a);
}

let reload = true;
let loading;
let loaded;

await get(); // initial load
watch(DB_FILE, () => {
	if (reload) return;
	reload = true;
	log_db(`marked for reload`);
}).unref(); // auto-invalidate, reloads on request

async function load() {
	let {basenames, reverse, index, root: json} = JSON.parse(await readFile(DB_FILE));

	// build tree from names
	let base = new Node('[base]');
	if (basenames) for (let name of basenames) base.create(name).is_base = true;

	// build tree from json
	let root = new Node('[root]');
	root.import_from_json(json);

	// create (optional) reverse names
	if (reverse) {
		let rnode = root.create(reverse);
		for (let rec of root.find_records()) {
			let address = rec.get(60);
			if (!address) continue;
			let label = address.input.slice(2).toLowerCase();
			if (!rnode.has(label)) { // use the first match
				rnode.create(label).rec = rec;
			}
		}
	}

	// create (optional) index nodes
	if (index) {
		let {label, limit} = index;
		for (let node of root.find_nodes()) {
			if (!node.size) continue;
			let json = {
				name: `Index of ${node.path}`,
				notice: `${node.size}`,
			};
			if (node.size <= limit) {
				json.description = [...node.keys()].join(', ');
			}
			let inode = node.create(label);
			inode.rec = Record.from_json(json, node);
			inode.hidden = true;
		}
	}

	return {base, root};
}

async function get() {
	if (reload) { // marked for reload
		reload = false;
		let p = loading = load().catch(x => x); // create future
		let res = await p; // wait for load
		if (p === loading) { // we're still the latest reload
			loading = null;
			if (res instanceof Error) {
				log_db(res);
			} else {
				loaded = res; // replace existing
				log_db(`reloaded`);
				res.base.print();
				res.root.print();
			}
		}
	}
	return loaded;
}

export async function fetch_root() {
	let {root} = await get();
	return root;
}
export async function fetch_record({labels}) {
	let {root, base} = await get();
	let take = labels.length; // use full name
	for (let i = take-1; i >= 0; i--) {
		base = base.get(labels[i]);
		if (!base) break; // unknown basename
		if (base.is_base) take = i; // remember match
	}
	return root.find(labels.slice(0, take).join('.'))?.rec;
}