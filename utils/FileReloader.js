import {watch} from 'node:fs';

export function FileReloader(file, reload, loader) {
	let timer;
	watch(file, () => {
		clearTimeout(timer);
		setTimeout(reload, 100);
	}).unref();
	return (into) => loader(file, into);
}