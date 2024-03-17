
import {Record} from '@resolverworks/enson';
import {SmartCache} from '../src/SmartCache.js';

// example for hidayath.eth

const cache = new SmartCache();

// fetch the name/node from your database
async function fetch_node(name) {
	// assume this returns something like:
	// {
	//    "records": {
	//      "name": "Chonk"
	//    }
	// }
}

// turn the result into a record
// (parses and validates all content once)
async function create_record(name) {
	let {records} = await fetch_node(name);
	if (records) {
		return Record.from(records);
	}
}

export default {
	slug: 'hidayath',
	async resolve(name) {
		return cache.get(name, 10000, create_record); // cache for 10 seconds
	}
}
