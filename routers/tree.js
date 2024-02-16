import {NodeRouter} from '../src/NodeRouter.js';
import {readFile} from 'node:fs/promises';

const router = new NodeRouter({slug: 'tree'});
router.watch_file(new URL('./tree.json', import.meta.url), async (file, {root, base}) => {
	let json = JSON.parse(await readFile(file));
	root.import_from_json(json.root);
	// optional
	let {basenames} = json;
	if (basenames) {
		for (let name of basenames) {
			base.create(name).is_base = true;
		}
	}
});
export default router;
