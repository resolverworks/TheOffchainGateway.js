import {Record, Node} from '@resolverworks/enson';
import {watch} from 'node:fs';
import {log} from './utils.js';

export class NodeRouter {
	constructor(slug, {reverse = 'addr.reverse', index = 100} = {}) {
		this.slug = slug;
		this._reload = true;
		this._loading = null;
		this._loaded = null;
		// features
		this.reverse = reverse;
		this.index = index;
	}
	async init() {
		await this.loaded(); // ensure the database loads the first time
	}
	async resolve(name) {
		let {root, base} = await this.loaded();
		let labels = name.split('.');
		let take = labels.length; // use full name
		for (let i = take-1; i >= 0; i--) {
			base = base.get(labels[i]);
			if (!base) break; // unknown basename
			if (base.is_base) take = i; // remember match
		}
		return root.find(labels.slice(0, take).join('.'))?.record;
	}
	async loaded() {
		if (this._reload) { // marked for reload
			this._reload = false;
			let p = this._loading = this.load().catch(x => x); // create future
			let res = await p; // wait for load
			if (p === this._loading) { // we're still the latest reload
				this._loading = null;
				if (res instanceof Error) {
					if (!this._loaded) throw res; // init() failed
					log(this.slug, res);
				} else {
					this._loaded = res; // replace existing
					log(this.slug, 'reloaded');
					res.base.print();
					res.root.print();
				}
			}
		}
		return this._loaded;
	}
	async load() {
		let root = Node.root();
		let base = Node.root('base')
		await this.loader({root, base});
		// create reverse names
		if (this.reverse) {
			let rnode = root.create(this.reverse);
			root.scan(node => {
				let {record} = node;
				if (!record) return;
				let address = record.getAddress(60); // TODO: assuming mainnet
				if (!address) return;
				let label = address.toPhex().slice(2).toLowerCase();
				if (!rnode.has(label)) { // use the first match
					rnode.create(label).record = record;
					rnode.create(`0x${label}`).record = record; // also 0x-prefixed
				}
			});
		}
		// create index nodes
		if (typeof this.index === 'number') {
			root.scan(node => {
				if (!node.size) return;
				let json = {
					name: `Index of ${node.name}`,
					notice: `${node.size}`,
				};
				if (this.index && node.size <= this.index) { // upper bound
					json.description = [...node.keys()].join(', ');
				}
				let inode = node.create('_'); // TODO: customize
				inode.record = Record.from(json);
				inode.hidden = true;
			});
		}
		return {base, root};
	}
	watch_file(file, parser) {
		let timer;
		watch(file, () => {
			clearTimeout(timer);
			timer = setTimeout(() => this._reload = true, 100);
		}).unref();
		this.loader = into => parser(file, into);
	}
}