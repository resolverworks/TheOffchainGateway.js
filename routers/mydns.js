import {Record} from '@resolverworks/enson';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache();

export default {
	slug: 'mydns',
	async resolve(name, context) {
		let base = context.searchParams.get('base');
		let path = base ? `${base}/mydns/${name}` : `${name}/mydns`;
		try {
			return await cache.get(path, x => fetch(`https://${x}.json`).then(r => r.json()).then(r => Record.from(r)));
		} catch (err) {
			return Record.from({name: path, description: err.message});
		}
	}
}
