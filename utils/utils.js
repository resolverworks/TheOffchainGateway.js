import {ethers} from 'ethers';
import {getCoderByCoinType} from '@ensdomains/address-encoder';

function pad2(x) { return String(x).padStart(2, '0'); }
export function log(...a) {
	let d = new Date();
	console.log(`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${d.toLocaleTimeString(undefined, {hour12: false})}`, ...a);
}

export function is_hex(s) {
	return typeof s === 'string' && /^0x[0-9a-f]*$/i.test(s);
}

export function is_address(s) {
	return typeof s === 'string' && s.length == 42 && is_hex(s);
}

export function bytes32_from(x) {
	return '0x' + BigInt(x).toString(16).padStart(64, '0').slice(-64);
}

export function labels_from_dns_encoded(v) {
	let labels = [];
	let pos = 0;
	while (true) {
		let n = v[pos++];
		if (!n) { // empty
			if (pos !== v.length) break; // must be last
			return labels;
		}
		if (v.length < pos+n) break; // overflow
		labels.push(ethers.toUtf8String(v.subarray(pos, pos += n)));
	}
	throw new Error('invalid DNS-encoded name');
}

export function safe_str(s) {
	return Array.from(s, ch => {
		let cp = ch.codePointAt(0);
		return cp >= 0x20 && cp < 0x80 ? ch : `{${cp.toString(16).toUpperCase().padStart(2, '0')}}`;
	}).join('');
}

export function split_norm(s) {
	return s ? ethers.ensNormalize(s).split('.') : [];
}

export function coin_name(type) {
	try {
		return getCoderByCoinType(type).name;
	} catch (err) {
		if (type >= 0x8000000) {
			return `evm:${type & 0x7FFFFFF}`;
		} else {
			return type;
		}
	}
}
