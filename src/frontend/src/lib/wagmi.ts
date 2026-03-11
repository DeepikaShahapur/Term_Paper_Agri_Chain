import { createConfig, http } from "wagmi";
import { hardhat, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const AGRICHAIN_ADDRESS   = (process.env.NEXT_PUBLIC_AGRICHAIN_ADDRESS   ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const ESCROW_ADDRESS      = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS      ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const REPUTATION_ADDRESS  = (process.env.NEXT_PUBLIC_REPUTATION_ADDRESS  ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
const CHAIN_ID            = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID     ?? "1337");
const RPC_URL             = process.env.NEXT_PUBLIC_RPC_URL               ?? "http://127.0.0.1:8545";

// Dynamically construct a chain that matches whatever network is deployed
const localChain = {
  ...hardhat,
  id: CHAIN_ID,
  name: CHAIN_ID === 1337 ? "Hardhat Local" : "Local Network",
  rpcUrls: {
    default: { http: [RPC_URL] },
    public:  { http: [RPC_URL] },
  },
} as const;

export const config = createConfig({
  chains:     [localChain, polygonAmoy],
  connectors: [injected()],        // ← any browser-injected wallet (no MetaMask SDK lock-in)
  transports: {
    [CHAIN_ID]:       http(RPC_URL),
    [polygonAmoy.id]: http(),
  },
});

export const contractAddresses = {
  agriChain:  AGRICHAIN_ADDRESS,
  escrow:     ESCROW_ADDRESS,
  reputation: REPUTATION_ADDRESS,
} as const;
