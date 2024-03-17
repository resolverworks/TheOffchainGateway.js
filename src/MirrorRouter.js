import {Record, Profile} from '@resolverworks/enson';
import {SmartCache} from './SmartCache.js';
import {ethers} from 'ethers';

export class MirrorRouter {
	constructor({
		slug, 
		rewrite, 
		provider, 
		profile = Profile.ENS(),
		ens = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', 
		multicall = '0xcA11bde05977b3631167028862bE2a173976CA11'
	}) {
		this.slug = slug;
		this.rewrite = rewrite;
		this.profile = profile;
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
	async fetch_record(name) {
		let node = ethers.namehash(name);
		let resolver = await this.ens.resolver(node); // TODO: use ensip-10
		if (resolver === ethers.ZeroAddress) return;
		let calls = this.profile.makeCalls(node);
		let answers = await this.multicall.tryAggregate(false, calls.map(data => [resolver, data]));
		let rec = new Record();
		rec.parseCalls(calls, answers.map(x => x[1]));
		return rec;
	}
}
