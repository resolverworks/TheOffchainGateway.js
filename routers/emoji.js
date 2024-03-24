import {Record} from '@resolverworks/enson';
import {ethers} from 'ethers';
import {SmartCache} from '../src/SmartCache.js';
import {ens_normalize, ens_emoji, ens_beautify, ens_tokenize} from '@adraffy/ens-normalize';
import {data_url_short_cps} from './utils.js';

const cache = new SmartCache();

const provider = new ethers.CloudflareProvider();
const ENS_OWNER_ABI = new ethers.Interface(['function ownerOf(uint256 token) view returns (address)']);
const ENS_721 = new ethers.Contract('0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85', ENS_OWNER_ABI, provider);
const ENS_WRAPPER = new ethers.Contract('0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401', ENS_OWNER_ABI, provider);

export default {
	slug: 'emoji',
	async resolve(name) {
		let cps;
		if (name) {
			let v = ens_tokenize(name);
			if (v.length != 1 || !v[0].emoji) return;
			cps = v[0].emoji;
		} else {
			let v = ens_emoji();
			cps = v[Math.random()*v.length|0];
		}
		return cache.get('SAME', 2000, () => fetch_shortest(String.fromCodePoint(...cps)));
	}
}

async function fetch_shortest(input) {
	let norm = ens_normalize(input);
	let form = ens_beautify(input);
	let cps = Array.from(norm, x => x.codePointAt(0));
	let len = cps.length;
	let record = Record.from({
		name: form,
		avatar: data_url_short_cps(cps),
		location: `${len} codepoint${len==1?'':'s'}`,
		description: Array.from(cps, x => x.toString(16).toUpperCase().padStart(2, '0')).join(' ')
	});
	try {
		let shortest = norm.repeat(Math.max(1, 4 - len));
		let owner = await ENS_721.ownerOf(ethers.id(shortest)).catch(() => false);
		if (!owner || owner === ENS_WRAPPER.target) {
			owner = await ENS_WRAPPER.ownerOf(ethers.namehash(shortest + '.eth'));
		}
		if (owner === ethers.ZeroAddress) {
			record.setText('location', '🎉️ Available!');
			record.setText('url', `https://app.ens.domains/${shortest}.eth`);
		} else {
			record.setAddress('eth', owner);
		}
	} catch (err) {
	}
	return record;
}
