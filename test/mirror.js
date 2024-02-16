import R from '../routers/mirror.js';

let rec = await R.fetch_record({labels: ['raffy']});

console.log(rec);
console.log(rec.toJSON());
