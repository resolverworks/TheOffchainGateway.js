import R, {format_price} from '../routers/coinbase.js';

for (let i = -3; i < 10; i++) {
	let p = 1.23 * (10 ** -i);
	console.log(format_price(p));
}

let rec = await R.resolve('btc');

console.log(rec);
