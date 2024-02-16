import {Router} from '../src/Router.js';
import {EVMAddressRecord} from '../src/EVMAddressRecord.js';
import {readFileSync} from 'node:fs';

let simple = JSON.parse(readFileSync(new URL('./simple.json', import.meta.url)));

export default Router.from({
	slug: 'simple',
	fetch_record({name}) {
		let a = simple[name];
		if (a) return EVMAddressRecord.from(a);
	}
});