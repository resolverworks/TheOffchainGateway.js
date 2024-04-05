import { XCTENSRouter } from "../src/XCTENSRouter.js";
import { Record, Coin, Node } from "@resolverworks/enson";
import { ethers } from "ethers";

// testnet: https://sepolia-rollup.arbitrum.io/rpc 421614

const CHAIN = 42161;

// supported basenames
const base = Node.root("base");
base.create("cu-cypherpunk.eth").is_base = true;

export default new XCTENSRouter({
  slug: "cypher",
  base,
  provider: new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc", CHAIN, {
    staticNetwork: true,
  }),
  contract: "0xEC2244b547BD782FC7DeefC6d45E0B3a3cbD488d",
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
  }
});
