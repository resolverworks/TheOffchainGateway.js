import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {readFileSync} from 'node:fs';

let simple = JSON.parse(readFileSync(new URL('./simple.json', import.meta.url)));

export default Router.from({
	slug: 'simple',
	fetch_record({name}) {
		let a = simple[name];
		if (a) return Record.from({$eth: a});
	}
});
