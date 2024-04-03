import cypher from '../routers/_cypher.js';
console.log(await cypher.resolve('darianb4'));


import {Address} from '@resolverworks/enson';
console.log(Address.from(60, new Uint8Array(1)))
