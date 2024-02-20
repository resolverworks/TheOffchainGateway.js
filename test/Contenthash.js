import {Contenthash} from '../src/Contenthash.js';

// TODO: fix me

let a = Contenthash.from_raw('0xe5010172002408011220c8a700c79100ff6d34c1be3d75729da863dbd4a86ec54b5347aaf9b88c4d137d');

console.log(a);
console.log(a.input);

let b = Contenthash.from_parts('ipns', 'k51qzi5uqu5dl6mkhgsua6663hpyb7zs8qjh5blic33j5393iie8abot6jydfh');

console.log(b);
console.log(b.input);
