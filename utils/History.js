export class History {
	constructor(level) {
		this.level = level;
		this.actions = [];
		this.children = [];
	}
	add(s) {
		this.actions.push(s);
	}
	next() {
		let {level} = this;
		if (!level) throw new Error('too deep');
		let child = new History(level-1);
		this.children.push(child);
		return child;
	}
	toString() {
		let desc = this.actions.join('.');
		if (this.error) {
			desc += `<${this.error}>`;
		} else if (this.children.length) {
			desc += `[${this.children.join(',')}]`;
		}
		return desc;
	}
}
