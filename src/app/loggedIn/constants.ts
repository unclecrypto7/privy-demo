import { Chain, defineChain, parseEther } from "viem";
import { ENTRYPOINT_ADDRESS_V07, ENTRYPOINT_ADDRESS_V06 } from "permissionless";

export const NETWORK_RPC_MAP: { [key: number]: Chain } = {
  2040: defineChain({
    id: 2040,
    name: "VANAR_MAINNET",
    nativeCurrency: {
      decimals: 18,
      name: "VANRY",
      symbol: "VANRY",
    },
    rpcUrls: {
      default: {
        http: ["https://rpc.vanarchain.com"],
        webSocket: ["wss://ws.vanarchain.com"],
      },
    },
    blockExplorers: {
      default: { name: "Explorer", url: "https://explorer.vanarchain.com" },
    },
  }),
};
