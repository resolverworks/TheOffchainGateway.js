
import {route} from './config.js';

// ************************************************************
// always returns raffy
import {Record} from './utils/Record.js';
route({
	slug: 'raffy',
	fetch_record() {
		return Record.from_json({
			name: 'Raffy',
			description: new Date().toLocaleString(),
			avatar: 'https://raffy.antistupid.com/ens.jpg',
			$eth: '0x51050ec063d393217B436747617aD1C2285Aeeee'
		});
	}
})


// ************************************************************
// simple {name: address} map from json
import {EVMAddressRecord} from './utils/EVMAddressRecord.js';
import {readFileSync} from 'node:fs';
let simple = JSON.parse(readFileSync(new URL('./examples/simple.json', import.meta.url)));
route({
	slug: 'simple',
	fetch_record({name}) {
		let a = simple[name];
		if (a) return EVMAddressRecord.from(a);
	}
});


// ************************************************************
// random addr(60) for any name
route({
	slug: 'rng',
	fetch_record() {
		return EVMAddressRecord.from('0x' + Array.from({length: 40}, () => (Math.random() * 16|0).toString(16)).join(''));
	}
});


// ************************************************************
// dynamic reload flat json with various records

import {NodeRouter} from './routers/NodeRouter.js';
import {FileReloader} from './utils/FileReloader.js';
import {parse_flat_json_file} from './parsers.js';
let flat_router = new NodeRouter({slug: 'flat'});
flat_router.loader = FileReloader(new URL('./examples/flat.json', import.meta.url), flat_router.reloader, parse_flat_json_file);
route(flat_router);


// ************************************************************
// dynamic reload tree json with various reacords
import {parse_tree_json_file} from './parsers.js';
let tree_router = new NodeRouter({slug: 'tree'});
tree_router.loader = FileReloader(new URL('./examples/tree.json', import.meta.url), tree_router.reloader, parse_tree_json_file);
route(tree_router);


// ************************************************************
// use airtable columns: [name, address]
import {AirtableRouter} from './routers/AirtableRouter.js';
route(new AirtableRouter({
	slug: 'air',
	secret: 'pat74noP03o6JK2ic.b0023a05e3b417174aaf3bff6325014166a4afcf6e47a5bdb470cfb33ceeb36e',
	base: 'appzYI39knUZdO88N'
}));


// ************************************************************
// create a mainnet rewriter
import {MirrorRouter} from './routers/MirrorRouter.js';
import {ethers} from 'ethers';
route(new MirrorRouter({
	slug: 'mirror',
	provider: new ethers.CloudflareProvider(),
	extract({labels}) {
		return `${labels[0]}.eth`; // "a.b.c" => "a.eth"  (leading label)
	}
}));
