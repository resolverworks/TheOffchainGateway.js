import {Router} from './Router.js';
import {Record} from './Record.js';
import {Address} from './Address.js';
import {SmartCache} from './SmartCache.js';
import {is_null_hex} from './utils.js';
import {ethers} from 'ethers';

const RESOLVER_IFACE = new ethers.Interface([
	'function interfaceImplementer(bytes32 node, bytes4 interfaceID) external view returns (address)',
	'function resolve(bytes name, bytes data) view returns (bytes)',
	'function addr(bytes32 node, uint coinType) view returns (bytes)',
	'function text(bytes32 node, string key) view returns (string)',
	'function contenthash(bytes32 node) view returns (bytes)',
	'function pubkey(bytes32 node) view returns (bytes32 x, bytes32 y)',
	'function name(bytes32 node) view returns (string)',
	'function recordVersions(bytes32 node) external view returns (uint64)',
	'function multicall(bytes[] calldata data) external returns (bytes[] memory results)',
]);

const FIELDS = [
	{type: 'text', key: 'name'},
	{type: 'text', key: 'description'},
	{type: 'text', key: 'avatar'},
	{type: 'text', key: 'url'},
	{type: 'text', key: 'notice'},
	{type: 'text', key: 'com.twitter'}, 
	{type: 'text', key: 'com.github'},
 	{type: 'addr', coin: 60},
	{type: 'addr', coin: 0},
	{type: 'contenthash'},
];

export class MirrorRouter extends Router {
	constructor({slug, rewrite, provider}) {
		super(slug);
		this.rewrite = rewrite;
		this.cache = new SmartCache();

		// contracts
		this.ens = new ethers.Contract('0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e', [
			'function resolver(bytes32 node) view returns (address)',
		], provider);
		this.multicall = new ethers.Contract('0xcA11bde05977b3631167028862bE2a173976CA11', [
			`function tryAggregate(bool requireSuccess, tuple(address target, bytes data)[] memory calls) public view returns (tuple(bool ok, bytes data)[] memory returnData)`
		], provider);
	}
	async fetch_record(info) {
		let name = await this.rewrite(info);
		return this.cache.get(name, 10000, x => this.resolve(x));
	}
	async resolve(name) {
		let node = ethers.namehash(name); // warning: this normalizes
		// TODO: this is only onchain
		let target = await this.ens.resolver(node);
		if (is_null_hex(target)) return;
		let calls = FIELDS.map(f => {
			let params = [node];
			switch (f.type) {
				case 'addr': params.push(f.coin); break;
				case 'text': params.push(f.key);  break;
			}
			return RESOLVER_IFACE.encodeFunctionData(RESOLVER_IFACE.getFunction(f.type), params);
		});
		let answers = await this.multicall.tryAggregate(false, calls.map(data => ({target, data})));
		let rec = new Record();
		FIELDS.forEach((f, i) => {
			let frag = RESOLVER_IFACE.getFunction(f.type);
			let {ok, data} = answers[i];
			if (!ok) return;
			if ((data.length - 2) & 63) return; // TODO: errors
			if (is_null_hex(data)) return; // null
			try {
				let values = RESOLVER_IFACE.decodeFunctionResult(frag, data);
				switch (f.type) {
					case 'addr': rec.set(f.coin, Address.from_raw(f.coin, values[0])); break;
					case 'text': rec.set(f.key, values[0]); break;
					case 'contenthash': rec.put(Record.CONTENTHASH, values[0]); break;
				}
			} catch (err) {
			}
		});
		return rec;
	}
}
