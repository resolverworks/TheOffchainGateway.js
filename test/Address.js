import test from 'node:test';
import assert from 'node:assert/strict';
import {ethers} from 'ethers';
import {Address} from '../src/Address.js';
import {getCoderByCoinName} from '@ensdomains/address-encoder';

test('Address', async t => {
	let known = [
		{
			name: 'eth',
			type: 60,
			input: '0x51050ec063d393217B436747617aD1C2285Aeeee',
			raw: '0x51050ec063d393217B436747617aD1C2285Aeeee'
		},
		{
			name: 'btc',
			type: 0,
			input: 'bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq',
			raw: '0x00142e6414903e4b24d05132352f71b75c165932a381',
		}
	];
	for (let x of known) {
		await t.test(`${x.name} is ${x.type}`, () => assert(getCoderByCoinName(x.name).coinType === x.type));
		await t.test(`${x.name} from input`, () => assert(0 === Buffer.compare(Address.from_input(x.name, x.input).bytes, ethers.getBytes(x.raw))));
		await t.test(`${x.type} from raw`, () => assert(Address.from_raw(x.type, x.raw).input == x.input));
	}
});

// console.log(Address.from_input('eth', '0x51050ec063d393217B436747617aD1C2285Aeeee'));
// console.log(Address.from_raw(60, '0x51050ec063d393217B436747617aD1C2285Aeeee'));
