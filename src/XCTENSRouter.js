import {Coin} from '@resolverworks/enson';
import {log, drop_base} from './utils.js';
import {ethers} from 'ethers';
import {Batcher} from './Batcher.js';
import {SmartCache} from './SmartCache.js';

const NFT_ABI = new ethers.Interface([
	'function ownerOf(uint256) returns (address)',
	'function name(uint256) returns (string)',
	'function text(uint256, string) returns (string)',
	'function addr(uint256, uint256) returns (bytes)',
	'function contenthash(uint256) returns (bytes)',
]);

const EVM_CTY = ethers.id('universal');

class XCTENSRecord {
	constructor(router, label) {
		this.router = router;
		this.label = label;
	}
	fetch(func, arg) {
		return this.router.batcher.add([func, this.label, arg]);
	}
	async text(key) {
		if (key === 'owner') {
			let [owner, network] = await Promise.all([this.fetch('ownerOf'), this.router.provider.getNetwork()]);
			return `eip155:${network.chainId}:${owner}`;
		} else {
			return this.fetch('text', key);
		}
	}
	async addr(cty) {
		if (Coin.fromType(cty).chain) {
			let [addr, addr0] = await Promise.all([
				this.fetch('addr', cty),
				this.fetch('addr', EVM_CTY)
			]);
			return addr ?? addr0;
		} else {
			return this.fetch('addr', cty);
		}
	}
	contenthash() {
		return this.fetch('contenthash');
	}
}

export class XCTENSRouter {
	constructor({slug, base, provider, contract, ...a}) {
		this.slug = slug;
		this.base = base;
		this.provider = provider;
		this.nft =  new ethers.Contract(contract, [
			'function totalSupply() view returns (uint256)',
			'function baseUri() view returns (string)',
			'function signer() view returns (address)',
		], provider);
		this.multicall = new ethers.Contract('0xcA11bde05977b3631167028862bE2a173976CA11', [
			'function tryAggregate(bool req, tuple(address, bytes)[] calls) view returns (tuple(bool, bytes)[])',
		], provider);
		this.cache = new SmartCache();
		this.batcher = new Batcher({
			ms_bucket: 50, // ms to wait
			max: 100, // max calls
			unwrap: true, // dont propagate errors
			key: item => ethers.id(item.join(':')).slice(2, 22),
			batch: async queue => {
				let calls = queue.map(({item: [func, label, arg]}) => {
					let args = [ethers.id(label)];
					if (arg !== undefined) args.push(arg);
					return [this.nft.target, NFT_ABI.encodeFunctionData(func, args)];
				});
				log(this.slug, `batch^${queue.length}`, [...new Set(queue.map(x => x.item[1]))]);
				try {
					let answers = await this.multicall.tryAggregate(false, calls);
					queue.forEach(({item: [func], callback}, i) => {
						let [ok, answer] = answers[i];
						if (ok) {
							try {
								let [res] = NFT_ABI.decodeFunctionResult(func, answer);
								if (func === 'addr' || func === 'contenthash') {
									res = ethers.getBytes(res);
								}
								return callback(true, res?.length ? res : undefined);
							} catch (err) {
							}
						}
						callback();
					});
				} catch (err) {
					queue.forEach(x => x.callback());
					log(this.slug, 'multicall failed', err);
				}
			}
		});
		Object.assign(this, a);
	}
	async totalSupply() {
		return this.cache.get('SUPPLY', () => this.nft.totalSupply().then(Number));
	}
	async resolve(name, context) {
		let label = drop_base(this.base, name);
		if (label.includes('.')) return;
		if (!label) return this?.resolveBasename(context);
		return new XCTENSRecord(this, label);
	}
	async GET({reply, path}) {
		if (path === '/') {
			// TODO: multicall this
			let [supply, mintSigner, baseURI, network] = await Promise.all([ 
				this.totalSupply(),
				this.nft.signer(),
				this.nft.baseUri(),
				this.provider.getNetwork(),
			]);
			reply.json({
				base: this.base.collect(x => x.is_base ? x.name : undefined),
				contract: this.nft.target,
				chain: Number(network.chainId),
				supply,
				baseURI,
				mintSigner,
				cached: this.batcher.cache.map.size,
				pending: this.batcher.pending.size,
			});
		}
	}
}
