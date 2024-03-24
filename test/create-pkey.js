import {ethers} from 'ethers';

let patt = /0x1234.{32}5678$/;

let n = 0;
let key, address;
while (true) {
	++n;
	key = ethers.randomBytes(32);
	address = ethers.computeAddress(ethers.SigningKey.computePublicKey(key));
	if (patt.test(address)) break;
}

console.log({
	t: performance.now(),
	n,
	pkey: ethers.hexlify(key),
	address
});
