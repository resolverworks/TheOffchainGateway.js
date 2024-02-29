# TheOffchainGateway.js
Offchain CCIP-Read Gateway in JS powered by [**ezccip.js**](https://github.com/resolverworks/ezccip.js/) and [**TheOffchainResolver.sol**](https://github.com/resolverworks/TheOffchainResolver.sol)

## Instructions

* `npm i`
* Create `.env` from [`.env.example`](./.env.example)
* By default, [`config.js`](./config.js) is using multiple [routers](#routers) defined in [`demo.js`](./demo.js)
* Start server: `npm run start`
* [Setup **TOR**](https://github.com/resolverworks/TheOffchainResolver.sol#context-format)

## Routers

* [`Router`](./routers/fixed.js) is named function, that given an name (`raffy.eth`), potentially returns a [`Record`](./test/Record.js)
	* Example: [`fixed.js`](./routers/fixed.js) has slug `fixed`
		* Mainnet Endpoint: `/fixed`
		* Goerli Deployment: `/fixed/g` — see [config.js](./config.js)
* There are [many example](./routers/) routers.
* You can host multiple independent routers simultaneously.
* [`MultiRouter`](#routers-as-subdomains-→-multirouterjs) lets a single endpoint access other routers using their slug.
	* Example: `/multi` + `"a.b.flat.c.d"` = `/flat` + `"a.b"`
* Routers with [`fetch_root()`](./utils/Router.js) like [Tree](#tree-database-via-noderouterjs) automatically have a JSON API:
	* [`GET /$slug/root`](https://raffy.xyz/tog/tree/tree) → tree-like JSON
	* [`GET /$slug/flat`](https://raffy.xyz/tog/tree/flat) → flat-like JSON
	* [`GET /$slug/names`](https://raffy.xyz/tog/tree/names) → JSON array of names with records

## Demo Routers

### [Fixed Record for ALL Names](./routers/fixed.js)

* [`Record`](./src/Record.js) is a JSON description of an [ENS profile](./test/record.js)
* Example: ENS [`fixed.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#fixed.tog.raffy.eth)
* Example: DNS [`raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#raffy.xyz)

### [Simple {name: address} Database](./routers/simple.js)
* Database: [`simple.json`](./routers/simple.json) 
* Example: ENS: [`carl.simple.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#carl.simple.tog.raffy.eth)
* Example: ENS: [`dave.simple.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#dave.simple.tog.raffy.eth)
* Example: DNS [`bob.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#bob.raffy.xyz)

### [Random Address](./routers/random.js)
* Example: ENS [`random.fixed.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#random.fixed.tog.raffy.eth)
* Example: DNS [`random.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#random.raffy.xyz)

### [Mainnet On-chain ".eth" Mirror](./routers/mirror.js) via [`MirrorRouter.js`](./src/MirrorRouter.js)

* Example: [`nick.mirror.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#nick.mirror.tog.raffy.eth) ↔ [`raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#nick.eth) 
* Example:  [`brantly.mirror.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#brantly.mirror.tog.raffy.eth) ↔ [`brantly.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#brantly.eth)

### [Coinbase Exchange Rates](./routers/coinbase.js) 

* Embedded current price in description 
* Example: [`eth.coinbase.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#eth.coinbase.tog.raffy.eth)
* Example: [`btc.coinbase.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#btc.coinbase.tog.raffy.eth)

### [Wikipedia](./routers/wikipedia.js)

* Example: [`ethereum.wiki.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#ethereum.wiki.tog.raffy.eth)
* Example: [`vitalik.wiki.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#vitalik.wiki.tog.raffy.eth)

### [Github](./routers/github.js)

* Example: [`adraffy.github.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#adraffy.github.tog.raffy.eth) via [`ENS.json`](https://github.com/adraffy/adraffy/blob/main/ENS.json)

### [Tree Database](./routers/tree.js) via [`NodeRouter.js`](./src/NodeRouter.js)
* Automatic reload after modification
* Automatic JSON API
* Supports multiple basenames
* Supports reverse names
* Supports auto-index (think index.html for ENS)
* Database: [`tree.json`](./examples/tree.json)
* Example: ENS [`tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#tree.tog.raffy.eth)
	* [`💎️.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#💎️.tree.tog.raffy.eth)
	* [`adraffy.alice.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#adraffy.alice.tree.tog.raffy.eth)
	* *autoindex* [`_.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#_.tree.tog.raffy.eth)
	* *auto-reverse* [`51050ec063d393217b436747617ad1c2285aeeee.addr.reverse.tree.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#51050ec063d393217b436747617ad1c2285aeeee.addr.reverse.tree.tog.raffy.eth)
* JSON API: [`/tree/`](https://raffy.xyz/tog/tree/tree) [`/flat/`](https://raffy.xyz/tog/tree/flat) [`/names/`](https://raffy.xyz/tog/tree/names)

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
### [Flat Database](./routers/flat.js)
* Like [Tree](#tree-database-via-noderouterjs) but uses a flat file format.
* Example Database: [`flat.json`](./routers/flat.json)
* Example: [`test.flat.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#test.flat.tog.raffy.eth)

### [Airtable](./routers/airtable.js) via [`AirtableRouter.js`](./src/AirtableRouter.js)
* Requires [airtable.com](https://airtable.com/) account → view [table](https://airtable.com/appzYI39knUZdO88N/shrkNXbY8tHEFk2Ew/tbl1osSFBUef6Wjof)
* Example: ENS [`air1.raffy.xyz.airtable.tog.raffy.eth`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#air1.raffy.xyz.airtable.tog.raffy.eth)
* Example: DNS [`air3.raffy.xyz`](https://adraffy.github.io/ens-normalize.js/test/resolver.html#air3.raffy.xyz)
