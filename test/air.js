import {AirtableStorage} from '../storage/AirtableStorage.js';

let store = new AirtableStorage({
	secret: 'pat74noP03o6JK2ic.b0023a05e3b417174aaf3bff6325014166a4afcf6e47a5bdb470cfb33ceeb36e',
	base: 'appzYI39knUZdO88N'
});

let rec = await store.fetch_record({name: 'air1.raffy.xyz'});
console.log(rec);
console.log(await rec.addr(60));