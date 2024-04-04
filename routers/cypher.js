import { XCTENSRouter } from "../src/XCTENSRouter.js";
import { Record, Profile, Coin, Node } from "@resolverworks/enson";
import { ethers } from "ethers";

const CHAIN = 42161;

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
  provider: new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc", CHAIN, {
    staticNetwork: true,
  }),
  contract: "0xEC2244b547BD782FC7DeefC6d45E0B3a3cbD488d",
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
      name: "A name for Rebels",
      description: `${supply.toLocaleString()} names registered on Arbitrum.  Tradable on Opensea.`,
      url: `https://cu-cypherpunk.com/`,
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
