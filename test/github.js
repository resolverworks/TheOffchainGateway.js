import R from '../routers/github.js';

console.log(await R.resolve('adraffy', {multi: true}));
console.log(await R.resolve('theoffchaingateway.js.resolverworks', {multi: true}));
