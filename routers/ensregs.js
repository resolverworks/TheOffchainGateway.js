import {Record, namesplit} from '@resolverworks/enson';
import {ens_beautify} from '@adraffy/ens-normalize';
import {safe_name} from '../src/utils.js';
import {SmartCache} from '../src/SmartCache.js';

const cache = new SmartCache({ms: 15000});

const MAX = 10;

export default {
	slug: 'ensregs',
	async resolve(name) {
		let labels = namesplit(name);
		let file = 'recent.json';
		let label = labels.pop();
		if (label === 'emoji') {
			file = 'emoji.json';
			label = labels.pop();
		}
		if (labels.length) return;
		let index = /^\d+$/.test(label) ? parseInt(label)-1 : 0;	
		index = Math.min(Math.max(0, index), MAX);
		let v = await cache.get(file, x => get_recent(x));
		return v[index];
	}
};

async function get_recent(file) {
	let r = await fetch(`https://alpha.antistupid.com/ens-regs/${file}?limit=${MAX}`);
	if (!r.ok) return [];
	let {decimals, regs} = await r.json();
	let scale = 10**decimals;
	return regs.map(reg => {
		let name = reg.label + '.eth';
		try {
			name = ens_beautify(name);
		} catch (err) {
			name = `⚠️ Not Normalized! ${safe_name(name)}`;
		}
		let v = [
			`Length(${[...reg.label].length})`,
			`Cost(${format_ether(reg.cost / scale)})`,
		];
		if (reg.premium) {
			v.push(`Premium(${format_ether(reg.premium / scale)})`);
		}
		v.push(reg.version == 2 ? 'Wrapped' : 'Unwrapped');
		//v.push(`Tx(${reg.tx})`);
		return Record.from({
			name,
			description: v.join(' • '),
			location: `Registered until ${new Date(reg.exp * 1000).toLocaleDateString()} (${format_sec(reg.dur)})`,
			$eth: reg.owner,
			url: `https://etherscan.io/tx/${reg.tx}`,
		});
	});
}

function trim_trailing_decimal_zeros(s) {
	return s.includes('.') ? s.replace(/\.?0*$/, '') : s;
}
function format_sec(sec) {
	if (sec < 60) {
		return `${Math.max(0, sec).toFixed(0)}s`;
	}
	let days = sec / 86400;
	if (days < 2) {
		let mins = sec / 60;
		if (mins < 90) {
			return `${mins.toFixed(0)}m`;
		} else {
			return `${(sec / 3600).toFixed(0)}ʜ`;
		}
	}
	if (days < 85) {
		return `${trim_trailing_decimal_zeros(days < 1 ? days.toPrecision(2) : days.toFixed(0))}ᴅ`;
	}
	let months = days / 30;
	if (Math.round(months) < 12) {
		return `${months.toFixed(0)}ᴍ`;
	}
	let years = days / 365;
	if (Math.round(years) < 100) {
		return `${trim_trailing_decimal_zeros(years.toFixed(years < 10 ? 1 : 0))}ʏ`;	
	}
	return `${years.toLocaleString(undefined, {maximumFractionDigits: 0})}ʏ`;
}

function format_ether(e) {
	return `${e && e < 0.001 ? e.toExponential(0) : trim_trailing_decimal_zeros(e > 10 ? e.toFixed(0) : e.toPrecision(2))}Ξ`;
}
