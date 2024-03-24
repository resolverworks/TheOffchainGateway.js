import {Record} from '@resolverworks/enson';
import {createNamespace} from '../src/namespace.js';

import cb from './coinbase.js';
import wiki from './wikipedia.js';
import mirror from './mirror.js';
import emoji from './emoji.js';

export default createNamespace('namespace', { // endpoint
	'raffy.eth': { // the name I want to describe
		'.': { // record for the parent name
			name: 'Andrew',
			description: 'p ^ ~p',
		},
		emoji, wiki, cb, // imported routers as "x.raffy.eth"
		moo: { // static records for "moo.raffy.eth"
			name: 'Good Morning Cafe Moo #331',
			avatar: 'https://gmcafe.s3.us-east-2.amazonaws.com/gmoo/original/331.png',
			url: 'https://www.gmcafe.io/moo/331'
		},
		async chonk(s) { // this is a subdomain that fetchs nft data
			if (s) return; // only allow "chonk.raffy.eth"
			let record = Record.from(await mirror.resolve('chonk239.nft-owner.eth')); // fetch through NFT Resolver
			record.setText('avatar', 'https://chonksociety.s3.us-east-2.amazonaws.com/images/239.png'); // patch the avatar
			return record;
		},
		debug(name, context) {
			return Record.from({
				name,
				location: new Date().toISOString(),
				description: `Namespace: ${context.space.name}\nBasename: ${context.base.name}`
			});
		}
	},
	'slobo.eth': {
		name: 'Alex',
		$eth: '0x534631Bcf33BDb069fB20A93d2fdb9e4D4dD42CF',
	}
});
