// signer private key
export const PRIVATE_KEY = '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

// address of TheOffchainResolver.sol on mainnet
export const THE_OFFCHAIN_RESOLVER = '0xa4407E257Aa158C737292ac95317a29b4C90729D';

// server port
export const HTTP_PORT = 8015;

// routers
export const ROUTERS = await Promise.all([
	import('./routers/raffy.js'),
	import('./routers/random.js'),
	import('./routers/simple.js'),
	import('./routers/flat.js'),
	import('./routers/tree.js'),
	import('./routers/airtable.js'),
	import('./routers/mirror.js'),
].map(p => p.then(x => x.default)));
