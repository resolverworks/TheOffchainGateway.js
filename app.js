import {createServer, HTTPError} from './utils/http.js';
import {log, is_address, is_hex, labels_from_dns_encoded, safe_str, coin_name} from './utils/utils.js';
import {HTTP_PORT, HTTP_ENDPOINT, PRIVATE_KEY, STORAGE, THE_RESOLVER_ADDRESS, EXP_SEC} from './config.js';
import {History} from './utils/History.js';
import {ethers} from 'ethers';

const SIGNING_KEY = new ethers.SigningKey(PRIVATE_KEY);
const ABI_CODER = ethers.AbiCoder.defaultAbiCoder();

const CCIP_ABI = cache_abi(new ethers.Interface([
	'function resolve(bytes name, bytes data) external view returns (bytes)',
	'function multicall(bytes[] calls) external view returns (bytes[])',
]));

const RESOLVER_ABI = cache_abi(new ethers.Interface([
	'function addr(bytes32 node) external view returns (address)',
	'function addr(bytes32 node, uint256 coinType) external view returns (bytes)',
	'function text(bytes32 node, string key) external view returns (string)',
	'function contenthash(bytes32 node) external view returns (bytes)',
	'function pubkey(bytes32 node) external view returns (bytes32, bytes32)',
	'function ABI(bytes32 node, uint256 contentTypes) external view returns (uint256, bytes memory)',
	'function multicall(bytes[] calls) external view returns (bytes[])',
]));

const http = createServer(async (req, reply) => {
	try {
		let url = new URL(req.url, 'http://a');
		reply.setHeader('access-control-allow-origin', '*');
		switch (req.method) {
			case 'GET': {
				if (url.pathname === '/') {
					return reply.end('hi');
				} else if (fetch_root && url.pathname === '/tree') {
					return reply.json(await fetch_root());
				} else if (fetch_root && url.pathname === '/names') {
					let root = await fetch_root();
					return reply.json([...root.find_nodes()].map(x => x.name));
				} else if (fetch_root && url.pathname === '/flat') {
					let root = await fetch_root();
					let flat = {};
					for (let node of root.find_nodes()) {
						if (node.rec) {
							flat[node.name] = node.rec;
						}
					}
					return reply.json(flat);
				}
				throw new HTTPError(404, 'file not found');
			}
			case 'OPTIONS': {
				reply.setHeader('access-control-allow-headers', '*');
				return reply.end();
			}
			case 'POST': {
				if (url.pathname === HTTP_ENDPOINT) {
					return await handle_ccip(req, reply);
				}
				throw new HTTPError(404, 'file not found');
			}
			default: throw new HTTPError(400, 'unsupported http method');
		}
	} catch (err) {
		if (err instanceof HTTPError) {
			reply.statusCode = err.code;
			log(req.method, req.url, `[${err.code}] ${err.message}`);
			return reply.json({message: err.message});
		} else {
			reply.statusCode = 500;
			log(req.method, req.url, err);
			return reply.json({message: 'internal error'});
		}
	}
});

const {fetch_record, fetch_root} = await import(STORAGE);
if (!fetch_record) throw new Error(`expected fetch_record()`);
await http.start_listen(HTTP_PORT);
console.log(`Listening on ${http.address().port}`);
console.log(`Endpoint: ${HTTP_ENDPOINT}`);
console.log(`Signer: ${ethers.computeAddress(SIGNING_KEY)}`);
console.log(`Storage: ${STORAGE}`);
console.log(`Storage supports fetch_root(): ${!!fetch_root}`);
RESOLVER_ABI.forEachFunction(f => console.log(`Supports [${f.selector}] ${f.__name}`));
log('Ready!');

// https://eips.ethereum.org/EIPS/eip-3668
async function handle_ccip(req, reply) {
	let {sender, data} = await req.read_json();
	if (!is_address(sender)) throw new HTTPError(400, 'expected sender address');
	if (!is_hex(data)) throw new HTTPError(400, 'expected calldata');
	sender = sender.toLowerCase();
	data = data.toLowerCase();
	let history = new History(1);
	let result = await handle_ccip_call(sender, data, history);
	let expires = Math.floor(Date.now() / 1000) + EXP_SEC;
	let hash = ethers.solidityPackedKeccak256(
		['address', 'uint64', 'bytes32', 'bytes32'],
		[THE_RESOLVER_ADDRESS, expires, ethers.keccak256(data), ethers.keccak256(result)]
	);
	let sig = SIGNING_KEY.sign(hash);
	let sig_data = ethers.concat([sig.r, sig.s, Uint8Array.of(sig.v)]);
	data = ABI_CODER.encode(['bytes', 'uint64', 'bytes'], [sig_data, expires, result]);
	log(history.toString());
	return reply.json({data});
}

async function handle_ccip_call(sender, data, history) {
	try {
		let method = data.slice(0, 10);
		let func = CCIP_ABI.getFunction(method);
		if (!func) throw new Error(`unsupported ccip method: ${method}`);
		let args = CCIP_ABI.decodeFunctionData(func, data);
		switch (func.__name) {
			case 'resolve(bytes,bytes)': {
				let labels = labels_from_dns_encoded(ethers.getBytes(args.name));
				let name = labels.join('.');
				history.add(`resolve(${safe_str(name)})`);
				let record = await fetch_record({labels, name, sender}); 
				return await handle_resolve(record, args.data, history);
				// returns without additional encoding
			}
			case 'multicall(bytes)': {
				history.add(`multicall`);
				args = [await Promise.all(args.calls.map(x => handle_ccip_call(sender, x, history.next()).catch(encode_error)))];
				break;
			}
			default: new Error('unreachable');
		}
		return CCIP_ABI.encodeFunctionResult(func, args);
	} catch (err) {
		history.error = err;
		throw err;
	}
}

async function handle_resolve(record, calldata, history) {	
	try {
		let method = calldata.slice(0, 10);
		let func = RESOLVER_ABI.getFunction(method);
		if (!func) throw new Error(`unsupported resolve() method: ${method}`);
		let args = RESOLVER_ABI.decodeFunctionData(func, calldata);
		switch (func.__name) {
			case 'ABI(bytes32,uint256)': {
				args = [0, '0x'];
				break;
			}
			case 'addr(bytes32)': {
				history.add(`addr()`);
				let value = await record?.addr?.(60);
				args = [value ? ethers.hexlify(value) : ethers.ZeroAddress];
				break;
			}
			case 'addr(bytes32,uint256)': {
				let type = Number(args.coinType);
				history.add(`addr(${coin_name(type)})`);
				let value = await record?.addr?.(type);
				args = [value || '0x'];
				break;
			}
			case 'text(bytes32,string)': {
				history.add(`text(${safe_str(args.key)})`);
				let value = await record?.text?.(args.key);
				args = [value || ''];
				break;
			}
			case 'contenthash(bytes32)': {
				history.add('contenthash()');
				let hash = await record?.contenthash?.();
				args = [hash || '0x'];
				break;
			}
			case 'pubkey(bytes32)': {
				history.add('pubkey()');
				let xy = await record?.pubkey?.();
				args = xy || [ethers.ZeroHash, ethers.ZeroHash];
				break;
			}
			case 'multicall(bytes[])': {
				history.add(`multicall`);
				args = [await Promise.all(args.calls.map(x => handle_resolve(record, x, history.next()).catch(encode_error)))];
				break;
			}
			default: throw new Error(`unreachable: ${func.__name}`);
		}
		return RESOLVER_ABI.encodeFunctionResult(func, args);
	} catch (err) {
		history.error = err;
		throw err;
	}
}

// format exception as `error Error(string)`
function encode_error(err) {
	return '0x08c379a0' + ABI_CODER.encode(['string'], [err.message]).slice(2);
}

function cache_abi(abi) {
	abi.forEachFunction(x => x.__name = x.format());
	return abi;
}
