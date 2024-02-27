import {ethers} from 'ethers';

let p = new ethers.CloudflareProvider();


console.log(await p.resolveName("slobo.xyz"));