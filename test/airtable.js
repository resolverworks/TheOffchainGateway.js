import R from '../routers/airtable.js';

let rec = await R.resolve('moo');

console.log(rec);
console.log(await rec.getAddress(60));
