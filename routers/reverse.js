import {Record} from '@resolverworks/enson';
import {is_address, nth_label} from '../src/utils.js';

export default {
	slug: 'reverse',
	async resolve(name, {ip}) {
		if (nth_label(name, 1) !== 'addr') return; // (0x?)[hex:40].addr.[reverse]...
		name = nth_label(name);
		if (!name.startsWith('0x')) name = '0x' + name; // be nice
		if (!is_address(name)) return;
		
		// quick hack TODO remove me
		if (name === '0xb404af9a235be881335d8898b5b487dc9cd5ed9d') return Record.from({[Record.NAME]: 'raffyraffy.eth'}); 

		let date = new Date().toISOString().slice(0, -5).replaceAll(/\D/g, '-');
		return Record.from({[Record.NAME]: `${ip}.${date}`});
	}
};
