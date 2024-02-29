import {NodeRouter} from '../src/NodeRouter.js';
import {Record} from '../src/Record.js';
import {readFile} from 'node:fs/promises';

const router = new NodeRouter({slug: 'flat'});
router.watch_file(new URL('./flat.json', import.meta.url), async (file, {root}) => {
	let json = JSON.parse(await readFile(file));
	for (let [ks, v] of Object.entries(json)) {
		for (let k of ks.split(/\s+/)) {
			root.create(k).rec = Record.from(v);
		}
	}
});
export default router;
