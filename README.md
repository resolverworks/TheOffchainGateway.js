# TheOffchainGateway.js
Simple Offchain ENS CCIP-Read Gateway in JS

*under construction*

## Instructions

* update [`config.js`](./config.js)
	* set private key
	* set server port and endpoint path
	* pick a [storage profile](#storage-profiles)
* start server: `node app.js`
* for **DNS**:
	* set `TXT` to `ENS1 $THE_RESOLVER_ADDRESS $YOUR_SIGNER $YOUR_ENDPOINT`
* for **ENS**:
	* set `PublicResolver.text("$YOUR_NAME, "ccip.context")` to `$YOUR_SIGNER $YOUR_ENDPOINT`
	* set `ENS.resolver("$YOUR_NAME")` to `$THE_RESOLVER_ADDRESS`

## Storage Profiles

### [storage/json/flat.js](./storage/json/flat.js)

* extremely simple
* loads [`flat.json`](./storage/json/flat.json) once on launch
* only `name` → `addr(60)`

### [storage/json/flat2.js](./storage/json/flat2.js)

* sync loads [`flat.json`](./storage/json/flat.json)
* reloads on change
* uses [`Tree`](./utils/tree.js) architecture
	* automatic `JSON` endpoints:
		* http://$server/root — tree `{label: record}`
		* http://$server/names — flat list of names
		* http://$server/flat — flat `{name: record}`

### [storage/json/tree.js](./storage/json/tree.js) (Default)

* uses [`Tree`](./utils/tree.js) architecture
* async loads [`tree.json`](./storage/json/tree.json)
```js
{
	// (optional) basenames are elided from the queried name
	"basenames": ["raffy.xyz", "raffy.eth"], 
	// (optional) if enabled, all $eth addresses are queriable as [hex].[reverse].[basename]
	// eg. {"$eth": "0x1234abcd"} + {"reverse": "rev"} => 1234abcd.rev.raffy.xyz
	"reverse": "addr.reverse", 
	// (optional) if enabled, "[label].name" will have a "description" equal to it's labels
	// eg. [a.x.eth, b.x.eth] => text(_.x.eth, "description") = "a, b"
	"index": { "label": "_", "limit": 100 },
	// the node graph
	"root": {
		// this is the "raffy.xyz" (root node) records
		".": {
			// text()
			"name": "Raffy",
			"avatar": "https://raffy.antistupid.com/ens.jpg",
			// addr()
			"$eth": "0x51050ec063d393217B436747617aD1C2285Aeeee",
			// contenthash()
			"#ipfs": "bafzaajaiaejcbsfhaddzcah7nu2mdpr5ovzj3kdd3pkkq3wfjnjupkxzxcge2e35",
			// pubkey()
			"#pubkey": { "x": 123, "y": 456 }
		},
		// this is "sub.raffy.xyz" records
		"sub": {
			"$btc": "bc1q9ejpfyp7fvjdq5fjx5hhrd6uzevn9gupxd98aq",
			"$doge": "DKcAMwyEq5rwe2nXUMBqVYZFSNneCg6iSL"
		}
	}
}
```

### [storage/mirror.js](./storage/mirror.js)

* dynamically mirrors `a.b.c` to `a.eth` using mainnet

### storage/sqlite.js (NYI)
