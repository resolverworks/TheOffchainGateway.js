import {Node} from './Node.js';
import {Record} from './Record.js';
import {Router} from './Router.js';
import {watch} from 'node:fs';

export class NodeRouter extends Router {
	constructor({slug, reverse = 'addr.reverse', index = 100}) {
		super(slug);
		this.reload = true;
		this.loading = null;
		this.loaded = null;

		// features
		this.reverse = reverse;
		this.index = index;
	}
	async init() {
		await this.fetch_root(); // ensure the database loads the first time
	}
	async fetch_root() {
		let {root} = await this.get();
		return root;
	}
	async fetch_record({name}) {
		let {root, base} = await this.get();
		let labels = name.split('.');
		let take = labels.length; // use full name
		for (let i = take-1; i >= 0; i--) {
			base = base.get(labels[i]);
			if (!base) break; // unknown basename
			if (base.is_base) take = i; // remember match
		}
		return root.find(labels.slice(0, take).join('.'))?.rec;
	}
	async get() {
		if (this.reload) { // marked for reload
			this.reload = false;
			let p = this.loading = this.load().catch(x => x); // create future
			let res = await p; // wait for load
			if (p === this.loading) { // we're still the latest reload
				this.loading = null;
				if (res instanceof Error) {
					this.log(res);
				} else {
					this.loaded = res; // replace existing
					this.log('reloaded');
					res.base.print();
					res.root.print();
				}
			}
		}
		return this.loaded;
	}
	async load() {
		let root = Node.root();
		let base = Node.root('base')
		await this.loader({root, base});
		// create reverse names
		if (this.reverse) {
			let rnode = root.create(this.reverse);
			for (let rec of root.find_records()) {
				let address = rec.get(60); // TODO: assuming mainnet
				if (!address) continue;
				let label = address.input.slice(2).toLowerCase();
				if (!rnode.has(label)) { // use the first match
					rnode.create(label).rec = rec;
					rnode.create(`0x${label}`).rec = rec; // also 0x-prefixed
				}
			}
		}
		// create index nodes
		if (typeof this.index === 'number') {
			for (let node of root.find_nodes()) {
				if (!node.size) continue;
				let json = {
					name: `Index of ${node.name}`,
					notice: `${node.size}`,
				};
				if (this.index && node.size <= this.index) { // upper bound
					json.description = [...node.keys()].join(', ');
				}
				let inode = node.create('_'); // TODO: customize
				inode.rec = Record.from(json, node);
				inode.hidden = true;
			}
		}
		return {base, root};
	}
	watch_file(file, parser) {
		let timer;
		watch(file, () => {
			clearTimeout(timer);
			timer = setTimeout(() => this.reload = true, 100);
		}).unref();
		this.loader = into => parser(file, into);
	}
}