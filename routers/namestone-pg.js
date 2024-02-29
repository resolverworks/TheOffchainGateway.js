import {Router} from '../src/Router.js';
import {Record} from '../src/Record.js';
import {Address} from '../src/Address.js';
import {SmartCache} from '../src/SmartCache.js';
import {log} from '../src/utils.js';
import {getCoderByCoinType} from '@ensdomains/address-encoder';
import postgres from 'postgres';

const sql = postgres(process.env.NAMESTONE_PG);
// why doesn't this library expose connect/disconnect events?

const domain_cache = new SmartCache();
const DOMAIN_CACHE_MS = 60000;
const record_cache = new SmartCache();
const RECORD_CACHE_MS = 15000;

async function find_domain(name) {
	log(`Finding domain: ${name}`);
	let [domain] = await sql`SELECT * FROM domain WHERE name = ${name} LIMIT 1`;
	//if (!domain) throw new Error(`"${asciiize(name)}" does not exist`);
	return domain;
} 

async function get_domain_record(domain) {
	let [[{n}], texts] = await Promise.all([
		sql`SELECT COUNT(*) AS n FROM subdomain WHERE domain_id = ${domain.id}`,
		sql`SELECT * FROM domain_text_record WHERE domain_id = ${domain.id}`,
	]);
	let rec = new Record();
	rec.set('notice', `ID(${domain.id}) Count(${n}/${domain.name_limit || '∞'}) Created(${domain.created_at.toISOString()})`);
	if (domain.address) rec.put('$eth', domain.address);
	if (domain.contenthash) rec.setContenthash(domain.contenthash);
	for (let {key, value} of texts) rec.set(key, value);
	return rec;
}

async function get_sub_record(domain, name) {
	let [subdomain] = await sql`SELECT * FROM subdomain WHERE domain_id = ${domain.id} AND name = ${name} LIMIT 1`;
	if (!subdomain) return; // silent
	let [texts, coins] = await Promise.all([
		sql`SELECT * FROM subdomain_text_record WHERE subdomain_id = ${domain.id}`,
		sql`SELECT * FROM subdomain_coin_type WHERE subdomain_id = ${domain.id}`,
	]);
	let rec = new Record();
	rec.set('notice', `ID(${domain.id}:${subdomain.id}) Created(${subdomain.created_at.toISOString()})`);
	if (subdomain.address) rec.put('$eth', subdomain.address);
	if (subdomain.contenthash) rec.setContenthash(subdomain.contenthash);
	for (let {key, value} of texts) rec.set(key, value);
	for (let {coin_type, address} of coins) {
		try {
			let coder = getCoderByCoinType(parseInt(coin_type));
			rec.set(coder.coinType, new Address(coder, address, coder.decode(address)));
		} catch (err) {
		}
	}
	return rec;
}

async function fetch_namestone(name) {
	const MIN = 2; // currently every domain is "a.b"
	let labels = name.split('.');
	if (labels.length < MIN) return;
	let basename = labels.splice(labels.length - MIN, MIN).join('.'); 
	let domain = await domain_cache.get(basename, DOMAIN_CACHE_MS, find_domain);
	if (!domain) return; // silent
	switch (labels.length) {
		case 0: return record_cache.get(name, RECORD_CACHE_MS, () => get_domain_record(domain));
		case 1: return record_cache.get(name, RECORD_CACHE_MS, () => get_sub_record(domain, labels[0]));
	}
}

export default Router.from({
	slug: 'pg',
	fetch_record({name}) { 
		return fetch_namestone(name);
	}
});
