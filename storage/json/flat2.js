import {Node, Record} from '../../utils/tree.js';
import {readFileSync} from 'node:fs';
import {watch} from 'node:fs';

const DB_FILE = new URL('./flat.json', import.meta.url);

let reload_timer;
let root;

reload();
watch(DB_FILE, () => {
	clearTimeout(reload_timer);
	reload_timer = setTimeout(reload, 1000).unref();	
}).unref(); 

function reload() {
	root = new Node('[root]');
	for (let [k, v] of Object.entries(JSON.parse(readFileSync(DB_FILE)))) {
		let rec = new Record();
		rec.put('name', k);
		rec.put('$eth', v);
		root.create(k).rec = rec;
	}
	root.print();
}

export async function fetch_root() {
	return root;
}
export async function fetch_record({name}) {
	return root.find(name)?.rec;
}
