import {Server} from 'node:net';
import {createServer, IncomingMessage, OutgoingMessage} from 'node:http';

export {createServer};

export class HTTPError extends Error {
	constructor(code, message) {
		super(message);
		this.code = code;
	}
}

Server.prototype.start_listen = async function(port) {
	return new Promise((ful, rej) => {
		const handler = err => {
			this.removeListener('listening', handler);
			this.removeListener('error', handler);
			if (err) {
				rej(err);
			} else {
				ful();
			}
		};
		this.on('listening', handler);
		this.on('error', handler);
		this.listen(port);
	});
};

IncomingMessage.prototype.read_body = async function() {
	let v = [];
	for await (const x of this) v.push(x);
	return Buffer.concat(v);
};

IncomingMessage.prototype.read_json = async function() { 
	try {
		return JSON.parse(await this.read_body());
	} catch (cause) {
		throw new HTTPError(400, 'malformed JSON', {cause});
	}
};

OutgoingMessage.prototype.json = function(json) {
	if (!Buffer.isBuffer(json)) {
		json = Buffer.from(JSON.stringify(json), 'utf8');
	}
	this.setHeader('content-length', json.length);
	this.setHeader('content-type', 'application/json');
	this.end(json);
};
