// TODO export this from ezccip or enson
//export {error_with} from '@resolverworks/enson';
export function error_with(message, params, cause) {
	let error;
	if (cause) {
		error = new Error(message, {cause});
		if (!error.cause) error.cause = cause;
	} else {
		error = new Error(message);
	}
	return Object.assign(error, params);
}


export function log(...a) {
	let date = new Date();
	let time = date.toLocaleTimeString(undefined, {hour12: false});
	date = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
	console.log(date, time, ...a);
}

export function is_null_hex(s) {
	return !s || /^(0x)?0*$/i.test(s);
}

export function is_address(s) {
	return typeof s === 'string' && s.length == 42 && is_hex(s);
}

export function nth_label(s, skip = 0) {
	if (!s) return;
	//return s.split('.').at(skip)
	if (skip < 0) {
		let last = s.length;
		let prev = s.lastIndexOf('.');
		while (skip < -1) {
			if (prev == -1) return;
			last = prev;
			prev = s.lastIndexOf('.', last - 1);
			++skip;
		}
		return prev < 0 ? s.slice(0, last) : s.slice(prev + 1, last); 
	} else {
		let last = 0;
		let next = s.indexOf('.');
		while (skip > 0) {
			if (next == -1) return;
			last = next + 1;
			next = s.indexOf('.', last);
			--skip;
		}
		return next < 0 ? s.slice(last) : s.slice(last, next);
	}
}
