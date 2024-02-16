import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';

export default Router.from({
	slug: 'raffy',
	fetch_record() {
		return Record.from({
			name: 'Raffy',
			description: new Date().toLocaleString(),
			avatar: 'https://raffy.antistupid.com/ens.jpg',
			$eth: '0x51050ec063d393217B436747617aD1C2285Aeeee'
		});
	}
});
