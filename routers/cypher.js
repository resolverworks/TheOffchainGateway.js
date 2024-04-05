import { XCTENSRouter } from "../src/XCTENSRouter.js";
import { Record, Coin, Node } from "@resolverworks/enson";
import { ethers } from "ethers";

const CHAIN = 421614;

// supported basenames
const base = Node.root("base");
base.create("cu-cypherpunk.eth").is_base = true;

export default new XCTENSRouter({
  slug: "cypher",
  base,
  provider: new ethers.JsonRpcProvider(
    "https://sepolia-rollup.arbitrum.io/rpc",
    CHAIN,
    { staticNetwork: true }
  ),
  contract: "0xcdB7fafde2212ec26F58F275FedF07a6Ef69814c",
  // called when the basename is resolved
  async resolveBasename(context) {
    let { target } = this.contract;
    let supply = await this.totalSupply();
    let rec = Record.from({
      name: 'A name for Rebels',
      description: `${supply.toLocaleString()} names registered on Arbitrum.  Tradable on Opensea.`,
      url: `https://cu-cypherpunk.com/`,
    });
    rec.setAddress("eth", context.resolver); // the requesting TOR
    rec.setAddress(Coin.fromChain(CHAIN), target);
    return rec;
  }
});
