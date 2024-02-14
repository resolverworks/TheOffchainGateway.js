import {readFile} from 'node:fs/promises';
import {Record} from './utils/Record.js';

// see: tree.json
export async function parse_tree_json_file(file, {root, base}) {
	let json = JSON.parse(await readFile(file));
	root.import_from_json(json.root);
	// optional
	let {basenames} = json;
	if (basenames) {
		for (let name of basenames) {
			base.create(name).is_base = true;
		}
	}
}

// see: flat.json
export async function parse_flat_json_file(file, {root}) {
	let json = JSON.parse(await readFile(file));
	for (let [k, v] of Object.entries(json)) {
		root.create(k).rec = Record.from_json(v);
	}
}
