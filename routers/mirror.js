import {MirrorRouter} from '../src/MirrorRouter.js';
import {ethers} from 'ethers';

export default new MirrorRouter({
	slug: 'mirror',
	provider: new ethers.CloudflareProvider(),
	extract({labels}) {
		return `${labels[0]}.eth`; // "a.b.c" => "a.eth"  (leading label)
	}
});
