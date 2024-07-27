"use client";

import { useCallback, useEffect, useState } from "react";
import { useDisconnect } from "wagmi";
import { useRouter } from "next/navigation";
import { Hash } from "viem";
import DemoTransactionButton from "../components/demo-transaction";

import { usePrivy } from "@privy-io/react-auth";
import Mint from "./Mint";
import { useSmartAccount } from "../hooks/smartAccount";

if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");

if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) throw new Error("Missing NEXT_PUBLIC_PIMLICO_API_KEY");

if (!process.env.NEXT_PUBLIC_JIFFYSCAN_API_KEY) throw new Error("Missing NEXT_PUBLIC_JIFFYSCAN_API_KEY");

if (!process.env.NEXT_PUBLIC_BUNDLER_URL) throw new Error("Missing NEXT_PUBLIC_BUNDLER_URL");

function LoggedIn() {
    const router = useRouter();
    const { isConnected, smartAccountClient, selectedChain } = useSmartAccount();
    const { disconnect } = useDisconnect();
    const [txHash, setTxHash] = useState<string | null>(null);
    const { ready, authenticated, logout } = usePrivy();

    useEffect(() => {
        if (ready && !authenticated) {
            router.push("/");
        }
    }, [ready, authenticated]);

    const signOut = useCallback(async () => {
        disconnect();
    }, [disconnect]);

    const onSendTransaction = useCallback((txHash: Hash) => {
        setTxHash(txHash);
    }, []);

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
