import {Record, Profile, Coin} from '@resolverworks/enson';
import {log, safe_name, SmartCache, drop_base} from './utils.js';
import {ethers} from 'ethers';

const NFT_ABI = new ethers.Interface([
	'function ownerOf(uint256) returns (address)',
	'function name(uint256) returns (string)',
	'function text(uint256, string) returns (string)',
	'function addr(uint256, uint256) returns (bytes)',
	'function contenthash(uint256) returns (bytes)',
]);

const EVM_CTY = BigInt('0x06e0989d8168c3a954e5b385b12a16a30139850a1596d8de0f6ecfc92bed71a8');

class XCTENSRecord extends Record {
	// get evmAddress() {
	// 	let v = super.addr(EVM_CTY);
	// 	if (v) return Address.from(v); // return as eth address
	// }
	addr(type) {
		let v = super.addr(type);
		if (!v && Coin.fromType(type).chain) {
			v = super.addr(EVM_CTY);
		}
		return v;
	}
}

export class XCTENSRouter {
	constructor({slug, base, provider, contract, ...a}) {
		this.slug = slug;
		this.base = base;
		this.provider = provider;
		this.contract =  new ethers.Contract(contract, [
			'function multicall(bytes[]) view returns (bytes[])',
			'function totalSupply() view returns (uint256)',
			'error ERC721NonexistentToken(uint256 token)',
		], provider);
		this.cache = new SmartCache();
		Object.assign(this, a);
	}
	tokenFor(label) {
		return BigInt(ethers.id(label));
	}
	async totalSupply() {
		return this.cache.get('SUPPLY', () => this.contract.totalSupply());
	}
	async resolve(name, context) {
		let label = drop_base(this.base, name);
		if (label.includes('.')) return;
		if (!label) return this?.resolveBasename(context);
		return this.cached(label);
	}
	async cached(label) {
		try {
			let norm = ethers.ensNormalize(label);
			if (norm !== label) throw new Error(`not normalized: ${norm}`);
			return this.cache.get(norm, x => this.fetch(x));
		} catch (err) {
			log(this.slug, safe_name(label), err.message);
		}
	}
	async profile(name, token) { 
		return Profile.ENS(); // you can override this
	}
	async fetch(label) {
		let token = this.tokenFor(label);
		let profile = await this.profile(token);
		if (!profile) throw new Error('no profile');
		let fields = [];
		for (let arg of profile.texts) fields.push({func: 'text', arg});
		for (let arg of profile.coins) fields.push({func: 'addr', arg});
		if (!profile.coins.has(EVM_CTY)) {
			fields.push({func: 'addr', arg: EVM_CTY});
		}
		if (profile.chash) {
			fields.push({func: 'contenthash'});
		}
		fields.push({func: 'ownerOf'});
		fields.push({func: 'name'});
		let calls = fields.map(({func, arg}) => {
			let args = [token];
			if (arg !== undefined) args.push(arg);
			return NFT_ABI.encodeFunctionData(func, args);
		});
		let answers;
		try {
			answers = await this.contract.multicall(calls);
		} catch (err) {
			if (err.revert?.name === 'ERC721NonexistentToken') {
				log(this.slug, safe_name(label), 'not found');
				return;
			}
			throw err;
		}
		let record = new XCTENSRecord();
		let info = {token, label};
		fields.forEach(({func, arg}, i) => {
			try {
				let [res] = NFT_ABI.decodeFunctionResult(func, answers[i]);
				if (func === 'text') {
					record.setText(arg, res);
				} else if (func === 'addr') {
					record.setAddress(arg, ethers.getBytes(res));
				} else if (func === 'contenthash') {
					record.setChash(ethers.getBytes(res));
				} else if (func === 'ownerOf') {
					info.owner = res;
				}
			} catch (err) {
			}
		});
		log(this.slug, safe_name(label));
		await this.decorateRecord?.(record, info);
		return record;
	}
}
