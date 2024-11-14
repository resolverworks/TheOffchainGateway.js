import { Record, Coin, namesplit } from "@resolverworks/enson";
import { ens_normalize } from "@adraffy/ens-normalize";
import { ethers } from "ethers";
import { SmartCache } from "../src/SmartCache.js";

const RESOLVER_ABI = new ethers.Interface([
  "function supportsInterface(bytes4) view returns (bool)",
  "function text(bytes32 node, string key) view returns (string)",
]);

const REGISTRY_ABI = new ethers.Interface([
  "function addr(bytes32 token, uint256 coinType) view returns (bytes)",
  "function text(bytes32 token, string key) view returns (string)",
  "function contenthash(bytes32 token) view returns (bytes)",
]);

const cache = new SmartCache();

function create_provider(chain, rpc) {
  return new ethers.JsonRpcProvider(rpc, chain, {
    staticNetwork: true,
    batchMaxCount: 10,
  });
}

//const src_provider = createProvider(1n, 'https://rpc.ankr.com/eth');
const src_provider = create_provider(
  1,
  "https://eth-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
);

const dst_providers = new Map();
async function add_provider(provider) {
  const { chainId } = await provider._detectNetwork();
  dst_providers.set(chainId, provider);
}
await add_provider(src_provider);
// List of chain providers with complete RPC endpoints using Alchemy API
// Base Mainnet
await add_provider(
  create_provider(
    8453,
    "https://base-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Base Sepolia (Testnet)
await add_provider(
  create_provider(
    84532,
    "https://base-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Optimism Mainnet
await add_provider(
  create_provider(
    10,
    "https://opt-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Optimism Sepolia (Testnet)
await add_provider(
  create_provider(
    11155420,
    "https://opt-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Arbitrum Mainnet
await add_provider(
  create_provider(
    42161,
    "https://arb-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Arbitrum Sepolia (Testnet)
await add_provider(
  create_provider(
    421614,
    "https://arb-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Scroll Mainnet
await add_provider(
  create_provider(
    534352,
    "https://scroll-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Scroll Sepolia (Testnet)
await add_provider(
  create_provider(
    534351,
    "https://scroll-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Linea Mainnet
await add_provider(
  create_provider(
    59144,
    "https://linea-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Linea Sepolia (Testnet)
await add_provider(
  create_provider(
    11155111,
    "https://linea-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// Polygon
await add_provider(
  create_provider(
    139,
    "https://polygon-mainnet.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

// eth-sepolia
await add_provider(
  create_provider(
    11155111,
    "https://eth-sepolia.g.alchemy.com/v2/" + process.env.ALCHEMY_KEY
  )
);

const ens = new ethers.Contract(
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
  ["function resolver(bytes32 node) view returns (address)"],
  src_provider
);

export default {
  slug: "durin",
  async resolve(name) {
    const { link, labels } = await cache.get(name, find_base);
    if (!link) return;
    if (labels.length == 0) {
      // this is the basename
      const rec = new Record();
      rec.setText("description", link.name);
      rec.setAddress("eth", link.registry.target);
      rec.setAddress(Coin.fromChain(link.chain), link.registry.target);
      return rec;
    } else if (labels.length == 1) {
      // this is a subdomain
      const token = ethers.id(labels[0]);
      return {
        text(key) {
          return link.registry.text(token, key);
        },
        addr(coinType) {
          return link.registry.addr(token, coinType);
        },
        contenthash() {
          return link.registry.contenthash(token);
        },
      };
    }
  },
};

async function get_link(name) {
  name = ens_normalize(name);
  return cache.get(name, async (name) => {
    const node = ethers.namehash(name);
    const address = await ens.resolver(node);
    if (address === ethers.ZeroAddress) return;
    const resolver = new ethers.Contract(address, RESOLVER_ABI, src_provider);
    const wild = await resolver.supportsInterface("0x9061b923");
    const config = await resolver.text(node, "registry");
    const match = config.match(/^(\d+):(0x[0-9a-f]{40})$/i);
    if (!match) throw new Error(`expected: CHAIN:0xADDRESS`);
    const chain = BigInt(match[1]);
    const provider = dst_providers.get(chain);
    if (!provider) throw new Error(`unsupported chain: ${chain}`);
    const registry = new ethers.Contract(match[2], REGISTRY_ABI, provider);
    console.log(`found: ${name} ${wild ? "wild" : ""}`);
    console.log(`registry: ${match[2]}`);
    return { name, node, resolver, wild, registry, chain };
  });
}

async function find_base(name) {
  let labels = namesplit(name);
  for (let drop = 0; drop < labels.length; drop++) {
    let link = await get_link(labels.slice(drop).join("."));
    if (!link) continue;
    if (drop && !link.wild) break;
    return {
      link,
      labels: labels.slice(0, drop),
    };
  }
  return {};
}
