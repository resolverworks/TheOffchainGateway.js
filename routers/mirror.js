import {MirrorRouter} from '../src/MirrorRouter.js';
import {ethers} from 'ethers';

export default new MirrorRouter({
	slug: 'mirror',
	provider: new ethers.CloudflareProvider(),
	// rewrite the name (this is the default)
	// async rewrite(name) {
	// 	return name;
	// }
});
