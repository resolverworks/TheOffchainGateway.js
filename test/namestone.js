import R from '../routers/namestone-pg.js';

// node --env-file=.env test/namestone.js

let rec = await R.resolve('tim.wassies.eth');

console.log(rec);
console.log(rec.toObject());
console.log(rec.toJSON());
