import {Router} from '../src/Router.js';
import {EVMAddressRecord} from '../src/EVMAddressRecord.js';
import {ethers} from 'ethers';

export default Router.from({
	slug: 'random',
	fetch_record() {
		return EVMAddressRecord.from(ethers.hexlify(ethers.randomBytes(20)));
	}
});
