import {AirtableRouter} from '../src/AirtableRouter.js';

// https://airtable.com/appzYI39knUZdO88N/shrkNXbY8tHEFk2Ew/tbl1osSFBUef6Wjof
// expects columns: [name, address]

export default new AirtableRouter({
	slug: 'airtable',
	secret: 'pat74noP03o6JK2ic.b0023a05e3b417174aaf3bff6325014166a4afcf6e47a5bdb470cfb33ceeb36e',
	base: 'appzYI39knUZdO88N'
});
