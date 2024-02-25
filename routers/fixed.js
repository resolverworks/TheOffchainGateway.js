import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';

export default Router.from({
	slug: 'fixed',
	fetch_record() {
		return Record.from({
			name: 'Hello from Fixed Router!',
			location: 'Internet',
			description: new Date().toLocaleString(),
			avatar: 'https://raffy.antistupid.com/ens.jpg',
			$eth: '0x51050ec063d393217B436747617aD1C2285Aeeee',
			$btc: 'bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq',
		});
	}
});
