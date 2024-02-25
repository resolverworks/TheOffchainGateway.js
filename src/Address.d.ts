import {BytesLike} from "ethers";
import {GetCoderByCoinType} from "@ensdomains/address-encoder/src/types.js";

export function $coin(query: {type?: number, evm?: number, name?: string}): GetCoderByCoinType<number>;

export class Address {
	static from_input(name: string, input: string); // throws
	static from_raw(type: number, raw: BytesLike); // throws

	readonly name: string;
	readonly bytes: Buffer;
	
	get type(): number;
	get input(): string;
}
