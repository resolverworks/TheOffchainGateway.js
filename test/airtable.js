import R from '../routers/airtable.js';

let rec = await R.fetch_record({name: 'air1.raffy.xyz'});
console.log(rec);
console.log(await rec.addr(60));
