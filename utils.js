import {ethers} from 'ethers';

function pad2(x) { return String(x).padStart(2, '0'); }
export function log(...a) {
	let d = new Date();
	console.log(`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${d.toLocaleTimeString(undefined, {hour12: false})}`, ...a);
}

export function is_address(s) {
	return typeof s === 'string' && /^0x[0-9a-f]{40}$/i.test(s);
}

export function is_hex(s) {
	return typeof s === 'string' && /^0x[0-9a-f]*$/i.test(s);
}

export function labels_from_dns_name(v) {
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
