import {Record, Node, namesplit} from '@resolverworks/enson';
import {log, SmartCache} from '../src/utils.js';

const cache = new SmartCache();

const record0 = Record.from({
	name: 'ENS for Github',
	location: '⚠️ Not Found: ENS.json',
	description: 'Add ENS.json ➡️ ENS 🥳️',
	avatar: 'https://imgur.com/ga6y0c0',
	url: 'https://github.com/resolverworks/TheOffchainGateway.js'
});

async function read_ens_json(account, repo) {
	return cache.get(`${account}/${repo}`, async path => {
		let res = await fetch(`https://github.com/${path}/raw/main/ENS.json`);
		if (!res.ok) {
			log(`github: ${path} => not found`);
			throw new Error(`HTTP ${res.status}`);
		}
		let json = await res.json();
		let root = Node.root();
		root.import(json);
		if (!root.record) root.record = new Record(); // rare
		if (!root.record.text('com.github')) root.record.setText('com.github', account);
		if (!root.record.text('url')) root.record.setText('url', `https://github.com/${account === repo ? account : path}`);
		return root;
	});
}

async function find_record(name) {
	if (!/^[a-z0-9-\.]+$/.test(name)) return; // could show error
	let parts = namesplit(name);
	let account = parts.pop();
	try {
		let root = await read_ens_json(account, account);
		let rest = parts.join('.');
		log(`github account: ${account} => ${rest}`);
		let node = root.find(rest);
		return node?.record;
	} catch (err) {
	}	
	for (let n = 1; n <= 2; n++) { // number of periods allowed in repo name
		if (n > parts.length) break;
		let repo = parts.slice(parts.length - n).join('.');
		try {
			let root = await read_ens_json(account, repo);
			let rest = parts.slice(0, -n).join('.');
			log(`github repo: ${account}/${repo} => ${rest}`);
			let node = root.find(rest);
			return node?.record;
		} catch (err) {
		}
	}
}

export default {
	slug: 'github',
	async resolve(name, {multi}) {
		if (!multi) {
			// theres's no generic way to remove the basename
			// without knowing it: adraffy[.github.eth]
			return; 
		}
		return find_record(name) || record0;
	}
};

