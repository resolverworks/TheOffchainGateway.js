import test from 'node:test';
import assert from 'node:assert/strict';
import {nth_label} from '../src/utils.js';

test('nth_label', async t => {
	let name = 'a.b.c';
	let v = name.split('.');
	await t.test('default', () => assert(nth_label(name) === v[0]));
	for (let i = 0; i < v.length; i++) {
		await t.test(`at +${i}`, () => assert(nth_label(name, i) === v[i]));
		await t.test(`at ${~i}`, () => assert(nth_label(name, ~i) === v.at(~i)));
	}
});
