import {Record} from '@resolverworks/enson';
import {ens_normalize, safe_str_from_cps, should_escape} from '@adraffy/ens-normalize';
import {data_url_short_cps} from './utils.js';
import {nth_label, SmartCache} from '../src/utils.js';

const cache = new SmartCache();
const MAX_CP = 0x10FFFF;

export default {
	slug: 'unicode',
	resolve(name) {
		let label = nth_label(name);
		let cp;
		if (label) {
			if (!/^\d+|0x[0-9a-f]+$/i.test(label)) return;
			cp = parseInt(label);
			if (cp > MAX_CP) return;
			label = cp;
		} else {
			cp = Math.random()*(MAX_CP+1)|0
		}
		return cache.get(label, async cp => {
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
	return cache.get('emoji', async () => {
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
	}, 86_400_000);
}
