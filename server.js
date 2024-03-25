import {createServer} from 'node:http';
import {EZCCIP} from '@resolverworks/ezccip';
import {ethers} from 'ethers';
import {log, error_with} from './src/utils.js';
import {ROUTERS, TOR_DEPLOYS, TOR_DEPLOY0} from './config.js';
import {NodeRouter} from './src/NodeRouter.js';

const PORT = parseInt(process.env.HTTP_PORT);

const signingKey = new ethers.SigningKey(process.env.PRIVATE_KEY); // throws
const signer = ethers.computeAddress(signingKey);

const routers = new Map();
function require_router(slug) {
	let router = routers.get(slug);
	if (!router) throw error_with(`router not found: "${slug}"`, {status: 404, slug});
	return router;
}

const ezccip = new EZCCIP();
ezccip.enableENSIP10((name, context, history) => context.router.resolve(name, context, history));

const http = createServer(async (req, reply) => {
	let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	try {
		let url = new URL(req.url, 'http://a');
		reply.setHeader('access-control-allow-origin', '*');
		switch (req.method) {
			case 'GET': {
				if (url.pathname === '/') {
					return write_json(reply, {
						greeting: 'Hello from TheOffchainGateway!',
						signer,
						routers: [...routers.keys()],
						TOR_DEPLOYS,
					});
				}
				let [_, slug, ...rest] = url.pathname.split('/');
				let router = require_router(slug);
				if (router instanceof NodeRouter) {
					let {root, base} = await router.loaded();
					switch (rest.join('/')) {
						case 'base':  return write_json(reply, base);
						case 'tree':  return write_json(reply, root);
						case 'names': return write_json(reply, root.collect(x => x.name));
						case 'flat':  return write_json(reply, root.collect(x => x.record ? [x.name, x.record] : undefined));
					}
				}
				throw error_with('file not found', {status: 404});
			}
			case 'OPTIONS': return reply.setHeader('access-control-allow-headers', '*').end();
			case 'POST': {
				let path = url.pathname.slice(1);
				if (path.endsWith('/')) path = path.slice(0, -1); // drop trailing slash
				let [slug, deploy] = path.split('/');
				let router = require_router(slug);
				if (!deploy) deploy = router.deploy ?? TOR_DEPLOY0;
				let resolver = TOR_DEPLOYS[deploy];
				if (!resolver) throw error_with(`resolver "${deploy}" not found`, {status: 404});
				let {sender, data: calldata} = await read_json(req);
				let {data, history} = await ezccip.handleRead(sender, calldata, {signingKey, resolver, router, routers, ip});
				log(ip, `${router.slug}/${deploy}`, history.toString());
				return write_json(reply, {data});
			}
			default: throw error_with('unsupported http method', {status: 405});
		}
	} catch (err) {
		let status = 500;
		let message = 'internal error';
		if (Number.isInteger(err.status)) {
			({status, message} = err);
		}
		log(ip, req.method, req.url, err);
		reply.statusCode = status;
		write_json(reply, {message});
	}
});

for (let r of ROUTERS) {
	try {
		if (!r.slug || !/^[a-z0-9-]+$/.test(r.slug)) throw new Error('expected slug');
		if (routers.has(r.slug)) throw new Error(`duplicate slug: ${r.slug}`);
		routers.set(r.slug, r);
		await r.init?.(ezccip);
		log(r.slug, 'ready');
	} catch (err) {
		throw error_with('router init', {router: r}, err);
	}
}
if (!routers.size) throw new Error(`expected a Router`);

// start server
http.listen(PORT).once('listening', () => {
	console.log(`Signer: ${signer}`);
	console.log('Routers:',  [...routers.keys()]);
	console.log('Deploys:', TOR_DEPLOYS);
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
		throw error_with('malformed JSON', {status: 422}, err);
	}
}
