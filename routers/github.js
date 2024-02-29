import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {Node} from '../src/Node.js';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache();

const record0 = Record.from({
	name: 'ENS for Github',
	location: '⚠️ Not Found: ENS.json',
	description: 'Add ENS.json ➡️ ENS 🥳️',
	avatar: 'https://imgur.com/ga6y0c0',
	url: 'https://github.com/resolverworks/TheOffchainGateway.js'
});

export default Router.from({
	slug: 'github',
	async fetch_record({name, multi}) {
		if (!multi) {
			// unknown basename
			// TODO: register under "github.eth"
			return; 
		}
		return this.find_record(name) || record0;
	},
	async find_record(name) {
		if (!name) return;
		let parts = name.split('.');
		let account = parts.pop();
		if (!/^[a-z0-9-]+$/.test(account)) return;
		try {
			let root = await this.read_ens_json(account, account);
			let rest = parts.join('.');
			this.log(`account: ${account} => ${rest}`);
			let node = root.find(rest);
			return node?.rec;
		} catch (err) {
		}	
		for (let n = 1; n <= 2; n++) { // number of periods allowed in repo name
			if (n > parts.length) break;
			let repo = parts.slice(parts.length - n).join('.');
			try {
				let root = await this.read_ens_json(account, repo);
				let rest = parts.slice(0, -n).join('.');
				this.log(`repo: ${account}/${repo} => ${rest}`);
				let node = root.find(rest);
				return node?.rec;
			} catch (err) {
			}
		}
	},
	async read_ens_json(account, repo) {
		return cache.get(`${account}/${repo}`, 10000, async path => {
			let res = await fetch(`https://github.com/${path}/raw/main/ENS.json`);
			if (!res.ok) {
				this.log(`not found: ${path}`);
				throw new Error(`HTTP ${res.status}`);
			}
			let json = await res.json();
			let root = Node.root();
			if (!root.rec) root.rec = new Record(); // rare
			if (!root.rec.has('com.github')) root.rec.set('com.github', account);
			if (!root.rec.has('url')) root.rec.set(`https://github.com/${account === repo ? account : path}`);
			root.import_from_json(json);
			return root;
		});
	}
});