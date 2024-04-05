import {Record} from '@resolverworks/enson';
import {nth_label, safe_name, log, curlyquote} from '../src/utils.js';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache();

export async function wikipedia(title) {
	log(`wiki page: ${title}`); // safe to print
	let res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
	let json = await res.json();
	let {titles: {canonical, normalized}, thumbnail, description, extract} = json;
	return Record.from({
		name: normalized,
		avatar: thumbnail.source, 
		location: description,
		description: extract,
		url: `https://en.wikipedia.org/wiki/${canonical}`
	});
}

export async function search(q) {
	log(`wiki search: ${safe_name(q)}`);
	let url = new URL('https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=1');
	url.searchParams.set('gsrsearch', q);
	let res = await fetch(url);
	let {query: {pages}} = await res.json();
	return Object.values(pages)[0];
	// { pageid: 18978754, ns: 0, title: 'Apple', index: 1 }
}

export default {
	slug: 'wiki',  
	async resolve(name) {
		let q = nth_label(name);
		try {
			let {title} = await cache.get(q, search);
			return await cache.get(title, wikipedia);
		} catch (err) {
		}
		return Record.from({description: `⚠️ No results for ${curlyquote(q)}`});
	}
};
