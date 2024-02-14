import {Router} from './utils/Router.js';

// signer private key
export const PRIVATE_KEY = '0xbd1e630bd00f12f0810083ea3bd2be936ead3b2fa84d1bd6690c77da043e9e02';

// seconds that a signed response is accepted by TheOffchainResolver.sol
export const EXP_SEC = 60; 

// address of TheOffchainResolver.sol on mainnet
export const THE_RESOLVER_ADDRESS = '0xa4407E257Aa158C737292ac95317a29b4C90729D';

// server port
export const HTTP_PORT = 8015;

// routes
export const ROUTER_MAP = new Map();
export function route(r) {
	ROUTER_MAP.set(r.slug, r instanceof Router ? r : Object.assign(new Router, r));
}
