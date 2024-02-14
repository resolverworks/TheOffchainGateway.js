# TheOffchainGateway.js
Simple Offchain DNS and ENS CCIP-Read Gateway in JS powered by [TheOffchainResolver.sol](https://github.com/resolverworks/TheOffchainResolver.sol)

## Instructions

* update [`config.js`](./config.js)
	* set private key
	* set server port and endpoint path
* update [`routes.js`]('./routes.js)
* start server: `node app.js`
* for **DNS**:
	* set `TXT` to `ENS1 $THE_RESOLVER_ADDRESS $YOUR_SIGNER $YOUR_ENDPOINT`
* for **ENS**:
	* set `PublicResolver.text($YOUR_NAME, "ccip.context")` to `$YOUR_SIGNER $YOUR_ENDPOINT`
	* set `ENS.resolver("$YOUR_NAME")` to `$THE_RESOLVER_ADDRESS`

## Routers

 * The `slug` is the `POST` endpoint path `/slug`
 * You can use [multiple routers.](./routes.js)
 * Routers that support [`fetch_root()`](./utils/Router.js) have a JSON API:
	* `GET /${slug}/root` &rarr; tree-like JSON
	* `GET /${slug}/flat` &rarr; flat-like JSON
	* `GET /${slug}/names` &rarr; JSON array of names with records

### Just One [`Record`](./utils/Record.js)

```js
route({
	slug: 'raffy',
	fetch_record() {
		return Record.from_json({
			name: 'Raffy',
			description: new Date().toLocaleString(),
			avatar: 'https://raffy.antistupid.com/ens.jpg',
			$eth: '0x51050ec063d393217B436747617aD1C2285Aeeee'
		});
	}
});
```

### Static `{name: addr(60)}` Database
```js
import {EVMAddressRecord} from './utils/EVMAddressRecord.js';
import {readFileSync} from 'node:fs';
let simple = readFileSync(new URL('./examples/simple.json', import.meta.url));
route({
	slug: 'simple',
	fetch_record({name}) {
		let a = simple[name];
		if (a) return EVMAddressRecord.from(a);
	}
});
```
#### [examples/simple.json](./examples/simple.json)
```js
{
          "raffy.xyz": "0x1111111111111111111111111111111111111111",
    "alice.raffy.xyz": "0x2222222222222222222222222222222222222222",
      "bob.raffy.xyz": "0x3333333333333333333333333333333333333333"
}
```

### Auto-reloading Tree Database
```js
import {NodeRouter} from './routers/NodeRouter.js';
import {FileReloader} from './utils/FileReloader.js';
import {parse_tree_json_file} from './parsers.js';
let router = new NodeRouter({
	slug: 'tree',
	// (optional) if enabled, all $eth addresses are queriable as [hex].[reverse].[basename]
	// eg. {"$eth": "0x1234abcd"} + {"reverse": "rev"} => 1234abcd.rev.raffy.xyz
	reverse: 'reverse.name'
	// (optional) if an integer, "_.name" will have a "description" equal to its children
	// eg. [a.x.eth, b.x.eth] => text(_.x.eth, "description") = "a, b"
	index: Infinity
});
router.loader = FileReloader(
	new URL('./examples/tree.json', import.meta.url), // file (see below)
	router.reloader,                                  // signal to router to reload()
	parse_tree_json_file                              // transforms json into nodes/records
);
```
#### [examples/tree.json](./examples/tree.json)
```js
{	
    "root": {
        ".": {
            // text()
            "name": "This is [raffy.xyz]",
            "avatar": "https://raffy.antistupid.com/ens.jpg",
            // addr()
            "$eth": "0x51050ec063d393217B436747617aD1C2285Aeeee",
            // contenthash()
            "#ipfs": "bafzaajaiaejcbsfhaddzcah7nu2mdpr5ovzj3kdd3pkkq3wfjnjupkxzxcge2e35",
            // pubkey()
            "#pubkey": { "x": 123, "y": 456 }
        },
        "alice": {
            "name": "This is sub[.raffy.xyz]",
            "$btc": "bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq", // native address
            "$doge": "DKcAMwyEq5rwe2nXUMBqVYZFSNneCg6iSL"         // native address
        },
        "aaa": {
            "bbb" {
                "name": "This is bbb.aaa[.raffy.xyz]"
            }
        }
    },
    // (optional) basenames are elided from the queried name
    "basenames": ["raffy.xyz", "raffy.eth"]
}
```
### Auto-reloading Flat Database
```js
import {NodeRouter} from './routers/NodeRouter.js';
import {FileReloader} from './utils/FileReloader.js';
import {parse_flat_json_file} from './parsers.js';
let router = new NodeRouter({slug: 'flat'});
router.loader = FileReloader(new URL('./examples/flat.json', import.meta.url), router.reloader, parse_flat_json_file);
route(router);
```
#### [examples/flat.json](./examples/flat.json)
```js
{
	"raffy.xyz": {
		"name": "raffy",
		"avatar": "https://gmcafe.s3.us-east-2.amazonaws.com/gmoo/jpg-256/1.jpg",
		"$eth": "0x1111111111111111111111111111111111111111"
	},
	"alice.raffy.xyz": {
		"name": "Alice",
		"avatar": "https://gmcafe.s3.us-east-2.amazonaws.com/gmoo/jpg-256/2.jpg",
		"$eth": "0x2222222222222222222222222222222222222222"
	}
}
```
### Airtable using `"name" + "address"` columns
```js
import {AirtableRouter} from './routers/AirtableRouter.js';
route(new AirtableRouter({
	slug: 'air',
	secret: '...',
	base: '...'
}));
```

### Mainnet On-chain Mirror
```js
import {MirrorRouter} from './routers/MirrorRouter.js';
import {ethers} from 'ethers';
route(new MirrorRouter({
	slug: 'mirror',
	provider: new ethers.CloudflareProvider(),
	// translate the incoming name into an on-chain name
	extract({name, labels}) {
		return `${labels[0]}.eth`; // "a.b.c" => "a.eth"  (leading label)
	}
}));
```