// TheOffchainResolver deployments
// https://github.com/resolverworks/TheOffchainResolver.sol
const TOR_DNS_MAINNET = '0xa4407E257Aa158C737292ac95317a29b4C90729D'; 
const TOR_DNS_SEPOLIA = '0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583';
const TOR_ENS_GOERLI  = '0x2e513399b2c5337e82a0a71992cbd09b78170843'; 

// routers will use this, unless query string is provided
export const TOR_DEFAULT = TOR_DNS_MAINNET;
export const TOR_CONTRACTS = {
	'eg': TOR_ENS_GOERLI,
	'd1': TOR_DNS_MAINNET,
	'ds': TOR_DNS_SEPOLIA,
};

// signer private key
export const PRIVATE_KEY = '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

// server port
export const HTTP_PORT = 8015;

// routers
export const ROUTERS = await Promise.all([
	import('./routers/fixed.js'),
	import('./routers/random.js'),
	import('./routers/simple.js'),
	import('./routers/flat.js'),
	import('./routers/tree.js'),
	import('./routers/airtable.js'),
	import('./routers/mirror.js'),
	import('./routers/coinbase.js'),
].map(p => p.then(x => x.default)));
