import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {ethers} from 'ethers';

export default Router.from({
	slug: 'random',
	fetch_record() {
		return Record.from({
			name: '🎲️',
			description: 'I resolve to a random ethereum address!',
			$eth: ethers.hexlify(ethers.randomBytes(20))
		});
	}
});
