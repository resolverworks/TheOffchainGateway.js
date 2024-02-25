// TheOffchainResolver deployments
// https://github.com/resolverworks/TheOffchainResolver.sol
export const TOR_DEPLOYS = {
	// DNS ONLY
	  '': '0xa4407E257Aa158C737292ac95317a29b4C90729D',
	'd1': '0xa4407E257Aa158C737292ac95317a29b4C90729D', // DNS Mainnet
	'ds': '0x179Be112b24Ad4cFC392eF8924DfA08C20Ad8583', // DNS Sepolia

	// ENS ONLY
	'eg': '0x2e513399b2c5337e82a0a71992cbd09b78170843', // ENS Goerli

	// BOTH
	'g': '0x9b87849Aa21889343b6fB1E146f9F734ecFA9982', // BOTH Goerli
	's': '0x9Ec7f2ce83fcDF589487303fA9984942EF80Cb39', // BOTH Sepolia
};

// signer private key
export const PRIVATE_KEY = '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

// server port
export const HTTP_PORT = 8015;

// routers
export {ROUTERS} from './routers/demo.js';
