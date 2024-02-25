import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {SmartCache} from '../src/SmartCache.js';


const cache = new SmartCache();

// example for hidayath.eth
async function get_mongo_node(name) {
	// assume this returns something like:
	// {
	//    "records": {
	//      "name": "Chonk"
	//    }
	// }
}

export default Router.from({
	slug: 'mongo',
	async fetch_record({name}) {
		let node = await cache.get(name, 10000, get_mongo_node);
		if (!node) return;
		let rec = new Record();
		for (let [k, v] of Object.entries(node.records)) {
			rec.put(k, v);
		}
		return rec;
	}
});
