import {Record} from '@resolverworks/enson';
import {createNamespace} from '../src/NamespaceRouter.js';

export default createNamespace('ns', {
	'': {
		'.': {
			name: ' ',
		},
		cb: {
			'*': 'coinbase',
		},
		inline: {
			'*': {
				resolve(name) {
					return Record.from({
						name: 'Chonk'
					});
				}
			}
		}
	}
});
