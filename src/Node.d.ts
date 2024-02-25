import {Record} from "./Record";

export class Node {
	constructor(label: string, parent?: Node);

	readonly label: string;
	readonly parent: Node;
	rec?: Record;
	hidden: boolean;

	find(namefrag: string): Node | undefined;
	create(namefrag: string): Node;
	ensure_child(label: string): Node;
	import_from_json(any: any): void;

	find_records(): Iterator<Record>;
	find_nodes(): Iterator<Node>;

	get name(): string;
	print(): void;
}
