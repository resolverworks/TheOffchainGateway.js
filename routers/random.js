import {Record} from '@resolverworks/enson';
import {ethers} from 'ethers';

export default {
	slug: 'random',
	resolve() {
		return Record.from({
			name: '🎲️',
			description: 'I resolve to a random ethereum address!',
			$eth: ethers.hexlify(ethers.randomBytes(20)),
		});
	}
};
