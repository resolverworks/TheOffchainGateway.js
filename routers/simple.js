import {Record} from '@resolverworks/enson';
import {readFileSync} from 'node:fs';

let simple = new Map(Object.entries(JSON.parse(readFileSync(new URL('./simple.json', import.meta.url)))).map(([name, $eth]) => {
	return [name, Record.from({$eth})];
}));

export default {
	slug: 'simple',
	resolve(name) {
		return simple.get(name);
	}
};
