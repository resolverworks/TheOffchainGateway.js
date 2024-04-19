import {XCTENSRouter} from '../src/XCTENSRouter.js';
import {Record, Coin, Node} from '@resolverworks/enson';
import {ethers} from 'ethers';

// example deployment of XCTENS
// https://github.com/resolverworks/XCTENS.sol
// https://sepolia.basescan.org/address/0x6f390c35b8b96dfdf42281cec36f1226eed87c6b

const CHAIN = 84532;

// supported basenames
const base = Node.root('base');
base.create('xctens-eg.eth').is_base = true;
base.create('xctens.eth').is_base = true;

export default new XCTENSRouter({
	slug: 'xctens',
	base,
	provider: new ethers.JsonRpcProvider('https://sepolia.base.org', CHAIN, {staticNetwork: true}),
	contract: '0x6f390C35b8b96dfDF42281Cec36f1226eEd87c6B',
	// called when the basename is resolved
	async resolveBasename(context) {
		let {target} = this.nft;
		let supply = await this.totalSupply();
		let rec = Record.from({
			name: `${supply.toLocaleString()} names registered`,
			description: 'XCTENS Demo!',
			url: `https://sepolia.basescan.org/address/${target}`
		});
		rec.setAddress('eth', context.resolver); // the requesting TOR
		rec.setAddress(Coin.fromChain(CHAIN), target);
		return rec;
	},
});
