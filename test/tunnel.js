import {ethers} from 'ethers';
import {flat_json} from '../routers/tunnel.js';

console.log(flat_json({a: 1, b: [2, "chonk"]}));

// see: routers/tunnel.js
// https://sepolia.etherscan.io/address/0xCa71342cB02714374e61e400f172FF003497B2c2
let provider = new ethers.InfuraProvider(11155111);
let contract = new ethers.Contract('0xCa71342cB02714374e61e400f172FF003497B2c2', [
	'function fetchFlatJSON(string url) view returns (tuple(string, string)[])'
], provider);

let res = await contract.fetchFlatJSON('https://api.gmcafe.io/metadata/gmoo/331.json', {enableCcipRead: true});

for (let x of res) {
	console.log(x.toArray());
}

