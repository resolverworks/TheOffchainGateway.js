# TheOffchainGateway.js
Offchain CCIP-Read Gateway in JS powered by [ezccip.js](https://github.com/resolverworks/ezccip.js/) and [TheOffchainResolver.sol](https://github.com/resolverworks/TheOffchainResolver.sol)

## Instructions

* Update [`config.js`](./config.js)
	* Set private key
	* Set server port
	* Pick [routers](./routers/)
* Start server: `npm run start`
	* Endpoint: `https://.../${slug}(/resolver)?`
		* Default: `/${slug}` →  `TOR_DNS_MAINNET`
		* Specific: `/${slug}/eg` → `TOR_ENS_GOERLI` (see config)
* [Setup context](https://github.com/resolverworks/TheOffchainResolver.sol?tab=readme-ov-file#context-format)

## Routers

 * The `slug` is the `POST` endpoint path `/${slug}`
 * You can use multiple routers at once.
 * Routers that support [`fetch_root()`](./utils/Router.js) like [`NodeRouter`](./src/NodeRouter.js) automatically have a JSON API:
	* `GET /${slug}/root` → tree-like JSON
	* `GET /${slug}/flat` → flat-like JSON
	* `GET /${slug}/names` → JSON array of names with records

### [Fixed](./routers/fixed.js) Record for ALL Names

* [`Record`](./src/Record.js) is a JSON description of an [ENS profile](./test/record.js)
* Example: [`raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.xyz)

### [Simple](./routers/simple.js) `{name: addr(60)}` Database
* Database: [`simple.json`](./routers/simple.json) 
* Example: [`bob.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#bob.raffy.xyz)

### [Random](./routers/random.js) Address Router
* Example: [`random.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#random.raffy.xyz)


### [Tree](./routers/tree.js) Database
* Automatic reload after modification
* Automatic JSON API
* Supports multiple basenames
* Supports reverse names
* Supports auto-index (think index.html for ENS)
* Database: [`tree.json`](./examples/tree.json)
* Example: [`alice.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#alice.raffy.xyz)

```js
import {NodeRouter} from './routers/NodeRouter.js';

let router = new NodeRouter({
    slug: 'tree',

    // (optional) if enabled, all $eth addresses are queriable as [hex].[reverse].[basename]
    // eg. {"$eth": "0x1234abcd"} + {"reverse": "rev"} => 1234abcd.rev.raffy.xyz
    reverse: 'reverse.name'

    // (optional) if an integer, "_.name" will have a "description" equal to its children
    // eg. [a.x.eth, b.x.eth] => text(_.x.eth, "description") = "a, b"
    index: Infinity
});
```
Tree format explained:
```js
{	
    // required: top-level node
    "root": {
        // this is the record for the parent node (eg. root's)
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
### [Flat](./routers/flat.js) Database
* Like [Tree](#auto-reloading-tree-database) but uses a flat file format.
* Example Database: [`flat.json`](./routers/flat.json)


### [Airtable](./routers/airtable.js) Router
* Requires [airtable.com](https://airtable.com/) account
* View [table](https://airtable.com/appzYI39knUZdO88N/shrkNXbY8tHEFk2Ew/tbl1osSFBUef6Wjof)
* [`air1.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#air1.raffy.xyz)/ [`air2.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#air2.raffy.xyz)

### Mainnet On-chain ".eth" [Mirror](./routers/mirror.js) Router

* Example: [`raffy.mirror.debug.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.mirror.debug.eth) ↔ [`raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.eth)

## [Coinbase](./routers/coinbase.js) Exchange Rate Router

* Example: [`eth.coinbase.debug.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html?goerli#eth.coinbase.debug.eth`)