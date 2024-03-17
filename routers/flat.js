import {NodeRouter} from '../src/NodeRouter.js';
import {Record} from '@resolverworks/enson';
import {readFile} from 'node:fs/promises';

const router = new NodeRouter('flat');
router.watch_file(new URL('./flat.json', import.meta.url), async (file, {root}) => {
	let json = JSON.parse(await readFile(file));
	for (let [ks, v] of Object.entries(json)) {
		for (let k of ks.split(/\s+/)) {
			root.create(k).record = Record.from(v);
		}
	}
});
export default router;
