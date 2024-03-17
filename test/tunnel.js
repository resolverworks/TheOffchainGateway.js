import {CloudflareProvider, InfuraProvider, ethers} from 'ethers';

// see: routers/tunnel.js
// https://sepolia.etherscan.io/address/0xCa71342cB02714374e61e400f172FF003497B2c2
let provider = new InfuraProvider(11155111);
let contract = new ethers.Contract('0xCa71342cB02714374e61e400f172FF003497B2c2', [
	'function fetchFlatJSON(string url) view returns (tuple(string, string)[])'
], provider);

let res = await contract.fetchFlatJSON('https://raw.githubusercontent.com/resolverworks/TheOffchainGateway.js/main/package.json', {enableCcipRead: true});


console.log(res);
