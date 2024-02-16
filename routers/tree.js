import {NodeRouter} from '../src/NodeRouter.js';
import {readFile} from 'node:fs/promises';

const router = new NodeRouter({slug: 'tree'});
router.watch_file(new URL('./tree.json', import.meta.url), async (file, {root, base}) => {
	// file was modified and needs reloaded
	
	// load "root" structure into root node
	let json = JSON.parse(await readFile(file));
	root.import_from_json(json.root);

	// optional basenames
	let {basenames} = json;
	if (basenames) {
		// if there are basenames, load them into base node
		for (let name of basenames) {
			base.create(name).is_base = true; // mark the leaf as a valid basename
		}
	}

	// on resolution:
	// find the deepest node in base that matches the name:
	//    basenames: ["raffy.xyz"] => "a.b.raffy.xyz" -> "raffy.xyz"
	// remove that from the name
	//    "a.b[.raffy.xyz]" => "a.b"
	// find that node in the root
});
export default router;
