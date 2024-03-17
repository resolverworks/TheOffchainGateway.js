import {Record} from '@resolverworks/enson';

export default {
	slug: 'fixed',
	resolve(name) {
		return Record.from({
			name: 'Hello from Fixed Router!',
			location: name,
			description: new Date().toLocaleString(),
			avatar: 'https://raffy.antistupid.com/ens.jpg',
			$eth: '0x51050ec063d393217B436747617aD1C2285Aeeee',
			$btc: 'bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq',
		});
	}
}

