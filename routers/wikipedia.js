import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {nth_label} from '../src/utils.js';

async function wikipedia(title) {
	let res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
	let json = await res.json();
	let {titles: {canonical, normalized}, thumbnail, description, extract} = json;
	return {
		name: normalized, 
		avatar: thumbnail.source, 
		notice: description,
		description: extract,
		url: `https://en.wikipedia.org/wiki/${canonical}`
	};
}

async function search(q) {
	let url = new URL('https://en.wikipedia.org/w/api.php?action=query&origin=*&format=json&generator=search&gsrnamespace=0&gsrlimit=1');
	url.searchParams.set('gsrsearch', q);
	let res = await fetch(url);
	let {query: {pages}} = await res.json();
	return Object.values(pages)[0];
	// { pageid: 18978754, ns: 0, title: 'Apple', index: 1 }
}

export default Router.from({
	slug: 'wiki',  
	async fetch_record({name}) {
		let q = nth_label(name);
		try {
			let {title} = await search(q);
			this.log(title);
			return Record.from(await wikipedia(title));
		} catch (err) {
			this.log(`Error: "${q}" ${err.message}`);
		}
		return Record.from({description: `⚠️ No results for "${q}"`});
	}
});

// //let info = await search('apple');
// let info = { pageid: 18978754, ns: 0, title: 'Apple', index: 1 };
// console.log(await wikipedia(info));