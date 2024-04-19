
import {Record} from '@resolverworks/enson';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache();

function record_from_transfer(tx) {
	return Record.from({
		name: tx.username,
		description: `Farcaster Fid #${tx.to}`,
		location: tx.from == 0 ? 'Minted' : `Previous #${tx.from}`,
		notice: `Tx(${tx.id}) Updated(${new Date(tx.timestamp * 1000).toISOString()})`,
		$eth: tx.owner,
		$op: tx.owner
	});
}

async function fetch_fname(fname) {
	let res = await fetch('https://fnames.farcaster.xyz/transfers/current?name=' + fname);
	if (!res.ok) return;
	let {transfer} = await res.json();
	let record = record_from_transfer(transfer);
	cache.add(transfer.to, record); // set the corresponding fid
	return record;
}

async function fetch_fid(fid) {
	let res = await fetch('https://fnames.farcaster.xyz/transfers/current?fid=' + fid);
	if (!res.ok) return;
	let {transfer} = await res.json();
	let record = record_from_transfer(transfer);
	cache.add(transfer.username, record); // set the corresponding fname
	return record;
}

export default {
	slug: 'fc',
	async resolve(name) {
		let match = name.match(/^fid\.(\d+)$/);
		if (match) {
			return cache.get(parseInt(match[1]), fetch_fid);
		} else {
			return cache.get(name, fetch_fname);
		}
	}
}
