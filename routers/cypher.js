import { XCTENSRouter } from "../src/XCTENSRouter.js";
import { Record, Profile, Coin, Node } from "@resolverworks/enson";
import { ethers } from "ethers";

// example deployment of XCTENS
// https://github.com/resolverworks/XCTENS.sol
// https://sepolia.basescan.org/address/0x6f390c35b8b96dfdf42281cec36f1226eed87c6b

const CHAIN = 421614;

// supported basenames
const base = Node.root("base");
base.create("cu-cypherpunk.eth").is_base = true;

// default profile
const profile = Profile.ENS();
profile.setText(["farcaster"]);
profile.setCoin(["arb1", "op", "base", "matic"]);

export default new XCTENSRouter({
  slug: "cypher",
  base,
  provider: new ethers.JsonRpcProvider(
    "https://sepolia-rollup.arbitrum.io/rpc",
    CHAIN,
    { staticNetwork: true }
  ),
  contract: "0xcdB7fafde2212ec26F58F275FedF07a6Ef69814c",
  async init() {
    console.log({
      bases: base.collect((x) => (x.is_base ? x.name : undefined)),
      texts: [...profile.texts],
      coins: [...profile.coins].map((x) => Coin.fromType(x).name),
    });
  },
  // called when the basename is resolved
  async resolveBasename(context) {
    let { target } = this.contract;
    let supply = await this.totalSupply();
    let rec = Record.from({
      name: `${supply.toLocaleString()} names registered`,
      description: "XCTENS Demo!",
      url: `https://sepolia.basescan.org/address/${target}`,
    });
    rec.setAddress("eth", context.resolver); // the requesting TOR
    rec.setAddress(Coin.fromChain(CHAIN), target);
    return rec;
  },
  // called when a record is going to get multicalled and cached
  // by default, the TOG will cache the standard profile + records above
  // but this is where you'd hook into an indexer
  async profile(/*label, token*/) {
    return profile;
  },
  // called upon successful resolve()
  // the 2nd argument is a kv of extra data {owner, token, label}
  async decorateRecord(record, { owner }) {
    if (owner) {
      record.setText("owner", `eip155:${CHAIN}/${owner}`);
    }
  },
});
