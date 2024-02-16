import {ethers} from 'ethers';

export function log(...a) {
	let date = new Date();
	let time = date.toLocaleTimeString(undefined, {hour12: false});
	date = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	console.log(date, time, ...a);
}

export function is_null_hex(s) {
	return !s || /^(0x)?0*$/i.test(s);
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

export function split_norm(s) {
	return s ? ethers.ensNormalize(s).split('.') : [];
}
