import {Router} from '../src/Router.js';
import {Node} from '../src/Node.js';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache();

export default Router.from({
	slug: 'github',  
	async fetch_record({name}) {
		// this is a hack since to work as demo
		// since this could be hosted under anyones domain
		let parts = name.split('.');
		if (parts.length < 4) throw new Error('too short');
		parts.pop(); // "eth"
		parts.pop(); // "debug"		
		// [sub][user][repo]
		for (let n = 1; n <= 2; n++) {
			let repo = parts.slice(parts.length - n).join('.');
			let user = parts[parts.length - (n + 1)];
			let rest = parts.slice(0, -(n + 1)).join('.');
			let path = `${user}/${repo}`;
			try {
				let root = await cache.get(path, 10000, async () => {
					let res = await fetch(`https://github.com/${user}/${repo}/raw/main/ENS.json`);
					if (!res.ok) throw new Error(`http ${res.status}`);
					let json = await res.json();
					let root = Node.root();
					root.import_from_json(json);
					return root;
				});	
				this.log(`${path} => ${rest}`);
				let node = root.find(rest);
				return node?.rec;
			} catch (err) {
				this.log(`no repo: ${path} ${err.message}`)
			}
		}
	}
});
