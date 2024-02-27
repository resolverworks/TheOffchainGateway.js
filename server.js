import {createServer} from 'node:http';
import {handleCCIPRead, RESTError} from '@resolverworks/ezccip';
import {ethers} from 'ethers';
import {log} from './src/utils.js';
import {Router} from './src/Router.js';
import {HTTP_PORT, PRIVATE_KEY, ROUTERS, TOR_DEPLOYS} from './config.js';

const signingKey = new ethers.SigningKey(PRIVATE_KEY);
const signer = ethers.computeAddress(signingKey);

const router_map = new Map();

const http = createServer(async (req, reply) => {
	try {
		let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		let url = new URL(req.url, 'http://a');
		reply.setHeader('access-control-allow-origin', '*');
		switch (req.method) {
			case 'GET': {
				if (url.pathname === '/') {
					return write_json(reply, {
						greeting: 'Hello from TheOffchainGateway!',
						signer,
						routers: [...router_map.keys()],
						TOR_DEPLOYS
					});
				}
				let [_, slug, ...rest] = url.pathname.split('/');
				let router = router_map.get(slug);
				if (router?.fetch_root) {
					let root = await router.fetch_root();
					switch (rest.join('/')) {
						case 'tree': return write_json(reply, root);
						case 'names': return write_json(reply, [...root.find_nodes()].map(x => x.name));
						case 'flat': {
							let flat = {};
							for (let node of root.find_nodes()) {
								if (node.rec) {
									flat[node.name] = node.rec;
								}
							}
							return write_json(reply, flat);
						}
					}
				}
				throw new RESTError(404, 'file not found');
			}
			case 'OPTIONS': return reply.setHeader('access-control-allow-headers', '*').end();
			case 'POST': {
				let path = url.pathname.slice(1);
				if (path.endsWith('/')) path = path.slice(0, -1); // drop trailing slash
				let [slug, deploy] = path.split('/');
				let router = router_map.get(slug);
				if (!router) throw new RESTError(404, `slug "${slug}" not found`);
				let resolver = TOR_DEPLOYS[deploy ?? ''];
				if (!resolver) throw new RESTError(404, `resolver "${deploy}" not found`);
				let {sender, data: request} = await read_json(req);
				let {data, history} = await handleCCIPRead({
					sender, request, signingKey, resolver,
					getRecord(x) { return router.fetch_record({...x, ip}); }
				});
				router.log(history.toString());
				return write_json(reply, {data});
			}
			default: throw new RESTError(400, 'unsupported http method');
		}
	} catch (err) {
		let status = 500;
		let message = 'internal error';
		if (err instanceof RESTError) {
			({status, message} = err);
		}
		log(req.method, req.url, err);
		reply.statusCode = status;
		write_json(reply, {message});
	}
});

for (let r of ROUTERS) {
	if (!(r instanceof Router)) throw new Error('expected Router');
	if (router_map.has(r.slug)) throw new Error(`duplicate slug: ${r.slug}`);
	router_map.set(r.slug, r);
	await r.init?.();
	r.log(`ready`);
}
if (!router_map.size) throw new Error(`expected a Router`);

// start server
http.listen(HTTP_PORT).once('listening', () => {
	console.log(`Signer: ${signer}`);
	console.log('Routers:',  [...router_map.keys()]);
	console.log('Deploys:', TOR_DEPLOYS);
	console.log(`Listening on ${http.address().port}`);
});

function write_json(reply, json) {
	let buf = Buffer.from(JSON.stringify(json, (_, x) => typeof x === 'bigint' ? '0x' + x.toString(16).padStart(64, '0') : x));
	reply.setHeader('content-length', buf.length);
	reply.setHeader('content-type', 'application/json');
	reply.end(buf);
}

async function read_body(req) {
	let v = [];
	for await (let x of req) v.push(x);
	return Buffer.concat(v);
}

async function read_json(req) {
	try {
		return JSON.parse(await read_body(req));
	} catch (err) {
		throw new RESTError(400, 'malformed JSON', err);
	}
}
