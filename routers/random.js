import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {ethers} from 'ethers';

export default Router.from({
	slug: 'random',
	fetch_record() {
		return Record.from({$eth: ethers.hexlify(ethers.randomBytes(20))});
	}
});
