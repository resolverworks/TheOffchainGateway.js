import {Record, Profile} from '@resolverworks/enson';
import {SmartCache} from './SmartCache.js';
import {ethers} from 'ethers';

const RESOLVER_ABI = new ethers.Interface([
	'function supportsInterface(bytes4) view returns (bool)',
	'function resolve(bytes name, bytes data) view returns (bytes)',
]);

export class MirrorRouter {
	constructor({
		slug, 
		rewrite = x => x, 
		provider, 
		profile = Profile.ENS(),
		ens = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', 
		multicall = '0xcA11bde05977b3631167028862bE2a173976CA11'
	}) {
		this.slug = slug;
		this.rewrite = rewrite;
		this.profile = profile;
		this.provider = provider;
		this.cache = new SmartCache();
		// contracts
		this.ens = new ethers.Contract(ens, [
			'function resolver(bytes32 node) view returns (address)',
		], provider);
		this.multicall = new ethers.Contract(multicall, [
			`function tryAggregate(bool req, tuple(address, bytes)[] memory calls) view returns (tuple(bool ok, bytes data)[] memory)`
		], provider);
	}
	async resolve(name) {
		return this.cache.get(await this.rewrite(name), 30000, x => this.fetch_record(x));
	}
	async find_resolver(name) {
		if (!name) return;
		let labels = name.split('.');
		for (let drop = 0; drop < labels.length; drop++) {
			let base = labels.slice(drop).join('.');
			let basenode = ethers.namehash(base);
			let address = await this.ens.resolver(basenode);
			if (address === ethers.ZeroAddress) continue;
			let contract = new ethers.Contract(address, RESOLVER_ABI, this.provider);
			let wild = await contract.supportsInterface('0x9061b923');
			if (drop && !wild) break;
			let tor = await contract.supportsInterface('0x73302a25');
			let node = ethers.namehash(name);
			return {name, node, base, basenode, address, wild, tor, drop};
		}
	}
	async fetch_record(name) {
		// this supports ENSIP-10 but requires on-chain
		let resolver = await this.find_resolver(name);
		if (!resolver) return;
		let {address, wild, tor, node} = resolver;
		let ensip_10 = wild && !tor; // TOR can be externally or resolve(multicalled) 
		let calls = this.profile.makeCalls(node);
		let answers = await this.multicall.tryAggregate(false, calls.map(v => {
			return [address, ensip_10 ? RESOLVER_ABI.encodeFunctionData('resolve', [ethers.dnsEncode(name, 255), v]) : v]
		}));
		let record = new Record();
		record.parseCalls(calls, answers.map(([ok, v]) => {
			if (ok) return ensip_10 ? RESOLVER_ABI.decodeFunctionResult('resolve', v)[0] : v;
		}));	
		return record;
	}
}
