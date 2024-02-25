export type JSONRecord = {[key: string]: any};

export class Record extends Map {
	static from(json: JSONRecord): Record;
	toJSON(): JSONRecord;
	put(key: string, value: any): void;

	static readonly CONTENTHASH: string;
	static readonly PUBKEY: string;
	static readonly NAME: string;
}
