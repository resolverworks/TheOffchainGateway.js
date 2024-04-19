import {ethers} from 'ethers';
import {Record, Node} from '@resolverworks/enson';
import {is_null_hex, curlyquote, log, drop_base} from '../src/utils.js';
import {SmartCache} from '../src/SmartCache.js';

const CONTRACT = '0x7C6EfCb602BC88794390A0d74c75ad2f1249A17f';
const WEBSITE = 'https://teamnick.xyz/';
const BASENAME = 'teamnick.xyz';

// supported basenames
const BASE = Node.root('base');
BASE.create('teamnick.eth').is_base = true;

const cache = new SmartCache();
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org', 8453, {staticNetwork: true});
const multicall = new ethers.Contract('0xcA11bde05977b3631167028862bE2a173976CA11', [
	`function tryAggregate(bool requireSuccess, tuple(address target, bytes data)[] memory calls) public view returns (tuple(bool ok, bytes data)[] memory returnData)`
], provider);
const contract = new ethers.Contract(CONTRACT, [
	`function totalSupply() view returns (uint256)`
], provider);
const abi = new ethers.Interface([
	'function addr(uint256 node) returns (address)',
	'function avatar(uint256 node) returns (string)',
	'function ownerOf(uint256 node) returns (address)',
	'function recordExists(uint256 node) returns (bool)',
	'function available(string name) returns (bool)',
]);
const calls = [
	{fn: 'addr'},
	{fn: 'avatar'},
	{fn: 'ownerOf'},
	{fn: 'recordExists'},
	{fn: 'available', name: true},
];
for (let x of calls) {
	x.fn = abi.getFunction(x.fn);
}

export default {
	slug: 'teamnick',
	async resolve(name) {
		name = drop_base(BASE, name);
		if (!name || name.includes('.')) {
			let supply = await cache.get('#', () => contract.totalSupply());
			return Record.from({
				name: `${supply.toLocaleString()} names registered`,
				$base: CONTRACT,
				description: `Register a free ENS Subname on Base. Tradable on OpenSea!`,
				location: BASENAME,
				url: WEBSITE,
			});
		}
		return cache.get(name, create_record);
	}
};

async function create_record(name) {
	log(`teamnick:`, {name});
	let {node, addr: $eth, avatar, ownerOf, available, recordExists} = await read_contract(name);
	if (recordExists) {
		return Record.from({
			name,
			description: `🔒️ ${ethers.getAddress(ownerOf)}`,
			$eth, avatar,
			url: `https://teamnick.xyz/nft/${BigInt(node).toString(10)}`,
		});
	} else if (available) {
		return Record.from({
			name,
			description: `✅️ ${curlyquote(name)} is available!`,
			location: BASENAME,
			url: WEBSITE,
		});
	} else {
		return Record.from({
			name,
			description: `⚠️ ${curlyquote(name)} is too short.`,
			location: BASENAME,
			url: WEBSITE
		});
	}
}

async function read_contract(label) {
	let node = ethers.id(label);
	let multi = await multicall.tryAggregate(false, calls.map(call => {
		return [CONTRACT, abi.encodeFunctionData(call.fn, [call.name ? label: node])];
	}));
	let rec = {node};
	calls.forEach((call, i) => {
		let [ok, data] = multi[i];
		if (ok && !is_null_hex(data)) {
			let res = abi.decodeFunctionResult(call.fn, data);
			if (res.length === 1) res = res[0];
			if (res) {
				rec[call.fn.name] = res;
			}
		}
	});
	return rec;
}

// console.log(await read_contract('raffy'));
// console.log(await read_contract('raffy12345'));
// console.log(await read_contract('a'));
