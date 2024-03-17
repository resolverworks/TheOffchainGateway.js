import R, {search} from '../routers/wikipedia.js';

let info = await search('apple'); 
console.log(info);
console.log(await R.resolve('apple'));
