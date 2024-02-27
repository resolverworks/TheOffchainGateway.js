import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {is_address} from '../src/utils.js';

const SUFFIX = '.addr.reverse';

export default Router.from({
	slug: 'reverse',
	async fetch_record({name, ip}) {
		if (!name.endsWith(SUFFIX)) return;
		name = '0x' + name.slice(0, -SUFFIX.length);
		if (!is_address(name)) return;
		let date = new Date().toISOString().slice(0, -5).replaceAll(/\D/g, '-');
		return Record.from({[Record.NAME]: `${ip}.${date}`});
	}
});
