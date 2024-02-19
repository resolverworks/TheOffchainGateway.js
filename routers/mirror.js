import {MirrorRouter} from '../src/MirrorRouter.js';
import {ethers} from 'ethers';
import {nth_label} from '../src/utils.js';

export default new MirrorRouter({
	slug: 'mirror',
	provider: new ethers.CloudflareProvider(),
	rewrite({name}) {
		return `${nth_label(name)}.eth`; // "[a].b.c" => "[a].eth"
	}
});
