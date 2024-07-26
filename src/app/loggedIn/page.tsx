"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useWalletClient } from "wagmi";
import { usePublicClient } from "wagmi";
import { useRouter } from "next/navigation";
import { SmartAccount, signerToSimpleSmartAccount } from "permissionless/accounts";
import { Address, Chain, Hash, Transport, http } from "viem";
import { ENTRYPOINT_ADDRESS_V06, SmartAccountClient, createSmartAccountClient, walletClientToSmartAccountSigner } from "permissionless";
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico";
import { sepolia, fuse } from "viem/chains";
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types";
import DemoTransactionButton from "../components/demo-transaction";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import Mint from "./Mint";
import { JiffyPaymaster } from "@jiffy-labs/web3a";

const jiffyscanKey = process.env.NEXT_PUBLIC_JIFFYSCAN_API_KEY as string;

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");

if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) throw new Error("Missing NEXT_PUBLIC_PIMLICO_API_KEY");

if (!process.env.NEXT_PUBLIC_JIFFYSCAN_API_KEY) throw new Error("Missing NEXT_PUBLIC_JIFFYSCAN_API_KEY");

if (!process.env.NEXT_PUBLIC_BUNDLER_URL) throw new Error("Missing NEXT_PUBLIC_BUNDLER_URL");

// Define the chains with their respective entry points and RPC URLs
const chains = [
    {
        name: "Fuse",
        chain: fuse,
        rpcUrl: `https://api.pimlico.io/v2/${fuse.id}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`,
        explorerUrl: "https://explorer.fuse.io/tx/",
    },
    {
        name: "Sepolia",
        chain: sepolia,
        rpcUrl: `https://api.pimlico.io/v2/${sepolia.id}/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`,
        explorerUrl: "https://sepolia.etherscan.io/tx/",
    },
];

function LoggedIn() {
    const router = useRouter();
    const { wallets, ready: walletsReady } = useWallets();
    const { disconnect } = useDisconnect();
    const { isConnected, ...account } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [txHash, setTxHash] = useState<string | null>(null);
    const [smartAccountClient, setSmartAccountClient] = useState<SmartAccountClient<ENTRYPOINT_ADDRESS_V06_TYPE> | null>(null);
    const [selectedChain, setSelectedChain] = useState(chains[0]);
    const embeddedWallet = useMemo(() => wallets.find((wallet) => wallet.walletClientType === "privy"), [wallets]);
    const { user, ready, authenticated, logout } = usePrivy();
    const { setActiveWallet } = useSetActiveWallet();

    // const pimlicoPaymaster = createPimlicoPaymasterClient({
    //     transport: http(selectedChain.rpcUrl),
    //     entryPoint: ENTRYPOINT_ADDRESS_V06
    // })
    const bundlerUrl = process.env.NEXT_PUBLIC_BUNDLER_URL as string;
    const jiffyPaymaster = new JiffyPaymaster(bundlerUrl, selectedChain.chain.id, {
        "x-api-key": jiffyscanKey,
    });

    const bundlerClient = createPimlicoBundlerClient({
        transport: http(selectedChain.rpcUrl),
        entryPoint: ENTRYPOINT_ADDRESS_V06,
    });

    useEffect(() => {
        if (embeddedWallet) {
            setActiveWallet(embeddedWallet);
        }
    }, [embeddedWallet]);

    useEffect(() => {
        if (ready && !authenticated) {
            router.push("/");
        }
    }, [ready, authenticated]);

    const signOut = useCallback(async () => {
        disconnect();
    }, [disconnect]);

    useEffect(() => {
        (async () => {
            if (isConnected && walletClient && publicClient) {
                const customSigner = walletClientToSmartAccountSigner(walletClient);

                const simpleSmartAccountClient = await signerToSimpleSmartAccount(publicClient, {
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    signer: customSigner,
                });

                const smartAccountClient = createSmartAccountClient({
                    account: simpleSmartAccountClient,
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    chain: selectedChain.chain,
                    bundlerTransport: http(process.env.NEXT_PUBLIC_BUNDLER_URL, {
                        fetchOptions: {
                            headers: { "x-api-key": jiffyscanKey },
                        },
                    }),
                    middleware: {
                        gasPrice: async () => (await bundlerClient.getUserOperationGasPrice()).fast,
                        sponsorUserOperation: jiffyPaymaster.sponsorUserOperationV6,
                    },
                });

                setSmartAccountClient(smartAccountClient);
            }
        })();
    }, [isConnected, walletClient, publicClient, selectedChain]);

    const onSendTransaction = useCallback((txHash: Hash) => {
        setTxHash(txHash);
    }, []);

    const handleChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedChainId = parseInt(e.target.value);
        const selected = chains.find((chain) => chain.chain.id === selectedChainId);
        if (selected) {
            setSelectedChain(selected);
        }
    };

    if (smartAccountClient && isConnected) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex flex-col items-center">
                    <div className="bg-white shadow-md rounded p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Smart Account Dashboard</h2>
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900">Smart contract wallet address:</label>
                            <div className="bg-gray-100 p-2 rounded break-all text-gray-900">
                                <code>{smartAccountClient.account?.address}</code>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block mb-2 text-sm font-medium text-gray-900">Select Chain:</label>
                            <select
                                className="block w-full p-2 border border-gray-300 rounded bg-gray-50 text-gray-900"
                                value={selectedChain.chain.id}
                                onChange={handleChainChange}
                            >
                                {chains.map((chain) => (
                                    <option key={chain.chain.id} value={chain.chain.id}>
                                        {chain.name} (ID: {chain.chain.id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4 flex flex-col space-y-4">
                            <Mint smartAccountClient={smartAccountClient} onSendTransaction={onSendTransaction} />
                            <DemoTransactionButton smartAccountClient={smartAccountClient} onSendTransaction={onSendTransaction} />
                            <button
                                onClick={logout}
                                className="mt-6 w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Sign out
                            </button>
                        </div>
                        {txHash && (
                            <div className="mt-4">
                                <label className="block mb-2 text-sm font-medium text-gray-900">Transaction hash:</label>
                                <a
                                    href={`${selectedChain.explorerUrl}${txHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline break-all"
                                >
                                    {txHash}
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

export default LoggedIn;
