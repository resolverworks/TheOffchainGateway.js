import {Record} from '@resolverworks/enson';
import {SmartCache} from '../src/SmartCache.js';
import {ens_normalize, safe_str_from_cps, should_escape} from '@adraffy/ens-normalize';
import {data_url_short_cps} from './utils.js';

const cache = new SmartCache();

export default {
	slug: 'unicode',
	resolve(s) {
		const max = 0x10FFFF;
		let cp = s ? parseInt(s) : (Math.random()*(max+1)|0);
		if (!(cp >= 0 && cp <= max)) return;
		return cache.get(cp, 5000, async cp => {
			let map = await get_char_map();
			let info = map.get(cp);
			let form = String.fromCodePoint(cp);
			let state;
			try {
				let norm = ens_normalize(form);
				state = norm === form ? '✅️ Normalized' : `🔀️ Mapped to "${norm}"`;
			} catch (err) {
				state = `❌️ ${err.message}`;
			}
			let parts = [`Dec: ${cp}`, `Hex: 0x${cp.toString(16).toUpperCase().padStart(2, '0')}`];
			if (info && info.script) {
				parts.push(`Script: ${info.script}`);
			}
			parts.push(state);
			let record = Record.from({
				name: info ? info.name : safe_str_from_cps([cp]),
				avatar: data_url_short_cps([should_escape(cp) ? 0xFFFD : cp]),
				location: should_escape(cp) ? null : form,
				description: parts.join(' • '),
				url: `https://www.compart.com/en/unicode/U+${cp.toString(16).toUpperCase().padStart(4, '0')}`,
				$eth: '0x' + cp.toString(16).padStart(40, '0'),
			});
			return record;
		});
	}
}

async function get_char_map() {
	return cache.get('emoji', 86_400_000, async () => {
		let res = await fetch('https://raw.githubusercontent.com/adraffy/ens-normalize.js/main/derive/output/names.json');
		if (!res.ok) throw new Error('wtf');
		let {chars, ranges, scripts} = await res.json();
		let map = new Map();
		for (let [cp, name] of chars) {
			map.set(cp, {name});
		}
		for (let [cp0, cp1, prefix] of ranges) {
			for (let cp = cp0; cp <= cp1; cp++) {
				let name = `${prefix} [${1+cp-cp0}/${1+cp1-cp0}]`;
				map.set(cp, {name});
			}
		}
		for (let {name, abbr, cps} of scripts) {
			for (let cp of cps) {
				let info = map.get(cp);
				if (!info) {
					info = {};
					map.set(cp, info);
				}
				info.script = name;
			}
		}
		return map;
	});
}
