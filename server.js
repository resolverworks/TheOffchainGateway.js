import {createServer} from 'node:http';
import {handleCCIPRead, RESTError} from '@resolverworks/ezccip';
import {ethers} from 'ethers';
import {log} from './src/utils.js';
import {Router} from './src/Router.js';
import {HTTP_PORT, PRIVATE_KEY, ROUTERS, THE_OFFCHAIN_RESOLVER} from './config.js';

const signingKey = new ethers.SigningKey(PRIVATE_KEY);

const router_map = new Map();

const http = createServer(async (req, reply) => {
	try {
		let url = new URL(req.url, 'http://a');
		reply.setHeader('access-control-allow-origin', '*');
		switch (req.method) {
			case 'GET': {
				if (url.pathname === '/') {
					return reply.end('Hello from TheOffchainGateway!');
				}
				let [_, slug, ...rest] = url.pathname.split('/');
				let router = router_map.get(slug);
				if (router) {
					switch (rest.join('/')) {
						case 'tree': return write_json(reply, await router.require_root());
						case 'names': {
							let root = await router.require_root();
							return write_json(reply, [...root.find_nodes()].map(x => x.name));
						}
						case 'flat': {
							let root = await router.require_root();
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
				let slug = url.pathname.slice(1);
				if (slug.endsWith('/')) slug = slug.slice(0, -1); // drop trailing slash
				let router = router_map.get(slug);
				if (router) {
					let {sender, data: request} = await read_json(req);
					let {data, history} = await handleCCIPRead({
						sender, request, signingKey, resolver: THE_OFFCHAIN_RESOLVER,
						getRecord(x) { return router.fetch_record(x); }
					});
					router.log(history.toString());
					return write_json(reply, {data});
				}
				throw new RESTError(404, `slug "${slug}" not found`);
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
	await r.fetch_root?.();
	r.log(`ready`);
}
if (!router_map.size) throw new Error(`expected a Router`);

// start server
http.listen(HTTP_PORT).once('listening', () => {
	console.log(`Signer: ${ethers.computeAddress(signingKey)}`);
	console.log(`Endpoints: ${[...router_map.keys()].join(' ')}`);
	console.log(`Listening on ${http.address().port}`);
});


function write_json(reply, json) {
	let buf = Buffer.from(JSON.stringify(json));
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
