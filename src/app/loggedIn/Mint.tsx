import { useState } from "react";

import { SmartAccountClient } from "permissionless";
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types";
import { encodeFunctionData } from "viem";
import { Hash } from "viem";
import { useSmartAccount } from "../hooks/smartAccount";
// import { useClipboard } from "react-use";

const contractAddress = "0x78e23b3Eb478110D508Ab1AC64b53C24520D68D3";
// Your contract ABI here

const Mint = ({
    smartAccountClient,
}: {
    smartAccountClient: SmartAccountClient<ENTRYPOINT_ADDRESS_V06_TYPE>;
    onSendTransaction: (txHash: Hash) => void;
}) => {
    const [txHash, setTxHash] = useState<string | null>(null);
    const { fetchUserOperationHash } = useSmartAccount();
    const [loading, setLoading] = useState("");

    const copyToClipboard = (text: string) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                alert("Transaction hash copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy text: ", err);
            });
    };
    //   const { copy, ready } = useClipboard();

    const mintTokens = async () => {
        if (!smartAccountClient) {
            console.log("smartAccountClient not initialized yet");
            return;
        }

        try {
            console.log("Minting 50 tokens...");
            setLoading("Minting");
            const txHash = await smartAccountClient.sendTransaction({
                to: "0xf61b1CA3cb7501a0D0f6f71317300f0B8f3060b3",
                value: BigInt("0"),
                data: encodeFunctionData({
                    functionName: "mintFifty",
                    abi: [
                        {
                            inputs: [
                                {
                                    internalType: "uint256",
                                    name: "_amount",
                                    type: "uint256",
                                },
                            ],
                            name: "mintFifty",
                            outputs: [],
                            stateMutability: "nonpayable",
                            type: "function",
                        },
                    ],
                    args: [BigInt("50")],
                }),
                account: smartAccountClient.account as unknown as `0x${string}`,
                chain: undefined,
            });
            setLoading("Fetching transaction details");

            const uoHash = await fetchUserOperationHash(txHash);
            onSendTransaction(uoHash);
            setLoading("");

            console.log("Transaction Receipt:", txHash);
        } catch (error) {
            console.error("Error sending transaction:", error);
        }
    };

    const onSendTransaction = (txHash: Hash) => {
        setTxHash(txHash);
    };

    return (
        <>
            <div className=" flex flex-col items-center justify-center bg-gray-900 text-white p-4">
                <h1 className="text-3xl font-bold mb-8">Mint Theodores Tokens</h1>
                {/* <input
        type="number"
        placeholder="Amount to mint"       
        className="mb-4 p-2 rounded text-black"
      /> */}
                <button onClick={mintTokens} className="btn btn-primary bg-blue-400 px-4 py-2">
                    Mint Tokens
                </button>
            </div>
            {loading != "" && (
                <div className="mt-4 w-full max-w-md">
                    <label className="block mb-2 text-sm font-medium text-gray-900">Loading:</label>
                    <div className="bg-gray-400 p-2 rounded break-all overflow-x-auto">{loading}</div>
                </div>
            )}
            {txHash && (
                <div className="mt-4 w-full max-w-md">
                    <label className="block mb-2 text-sm font-medium text-gray-900">Mint Transaction hash:</label>
                    <div className="bg-gray-200 p-2 rounded break-all overflow-x-auto">
                        <a
                            href={`https://jiffyscan.xyz/userOpHash/${txHash}?network=base`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                        >
                            {txHash}
                        </a>
                        <button
                            onClick={() => copyToClipboard(txHash)}
                            className="mt-2 w-48 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Copy Hash
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default Mint;

function onSendTransaction(txHash: any) {
    throw new Error("Function not implemented.");
}
