import {MirrorRouter} from '../routers/MirrorRouter.js';
import {ethers} from 'ethers';

let mirror = new MirrorRouter({
	provider: new ethers.CloudflareProvider()
});

console.log(await mirror.resolve('raffy.eth').then(r => r.toJSON()));
