import {BytesLike} from "ethers";

export class Contenthash {
	static from_raw(raw: BytesLike);  // throws
	static from_parts(codec: string, input: string); // throws
	
	readonly codec: string;
	readonly bytes: Buffer;

	get input(): string;
}
