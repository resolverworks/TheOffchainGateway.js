import {Record} from '../src/Record.js';

let rec = new Record();
rec.put('name', 'raffy');
rec.put('description', 'chonk');

rec.put('$eth', '0x1934FC75aD10d7eEd51dc7A92773cAc96A06BE56');
rec.put('$btc', 'bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq');
rec.put('$doge', 'DKcAMwyEq5rwe2nXUMBqVYZFSNneCg6iSL');

rec.put('#ipfs', 'bafybeiawq7pbt4krnopfmcvymvp2uz4ohibd5p7ugskkybvdmwa2v7evpy');
rec.put('#ipns', 'k51qzi5uqu5dl6mkhgsua6663hpyb7zs8qjh5blic33j5393iie8abot6jydfh');
rec.put('#arweave', 'yBYkngZXGCQgYU-nUCwo5vns2ALUU0LXXZrCUlUUWkk');

// same as #pubkey
rec.put(Record.PUBKEY, {x: 1, y: 2});

// same as #contenthash
rec.put(Record.CONTENTHASH, '0xe301017012201687de19f1516b9e560ab8655faa678e3a023ebff43494ac06a36581aafc957e');

console.log(rec);
console.log(rec.toJSON());
