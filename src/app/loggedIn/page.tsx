"use client";

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAccount, useDisconnect, useWalletClient } from "wagmi"
import { usePublicClient } from "wagmi"
import { useRouter } from "next/navigation";
import {
    SmartAccount,
    signerToSimpleSmartAccount
} from "permissionless/accounts"
import { Address, Chain, Hash, Transport, http } from "viem"
import {
    ENTRYPOINT_ADDRESS_V06,
    SmartAccountClient,
    createSmartAccountClient,
    walletClientToSmartAccountSigner,
} from "permissionless"
import { createPimlicoBundlerClient, createPimlicoPaymasterClient } from "permissionless/clients/pimlico"
import { sepolia, fuse } from "viem/chains"
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import  DemoTransactionButton from "../components/demo-transaction";

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';



if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID)
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID")

if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY)
    throw new Error("Missing NEXT_PUBLIC_PIMLICO_API_KEY")

const pimlicoRpcUrl = `https://api.pimlico.io/v2/122/rpc?apikey=${process.env.NEXT_PUBLIC_PIMLICO_API_KEY}`

const pimlicoPaymaster = createPimlicoPaymasterClient({
    transport: http(pimlicoRpcUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V06
})

const bundlerClient = createPimlicoBundlerClient({
    transport: http(pimlicoRpcUrl),
    entryPoint: ENTRYPOINT_ADDRESS_V06,
})


function loggedIn() {

    const router  = useRouter();
    const {wallets, ready: walletsReady} = useWallets();
    const { disconnect } = useDisconnect();
    const { isConnected, ...account } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const [txHash, setTxHash] = useState<string | null>(null);
    const [smartAccountClient, setSmartAccountClient] =
        useState<SmartAccountClient<ENTRYPOINT_ADDRESS_V06_TYPE> | null>(
            null
        )
    const embeddedWallet = useMemo(
        () => wallets.find((wallet) => wallet.walletClientType === "privy"),
        [wallets]
    )
    const {user,ready, authenticated, logout} = usePrivy();
    const {
        setActiveWallet
    } = useSetActiveWallet();

    useEffect(() => {
        if (embeddedWallet) {
            setActiveWallet(embeddedWallet)
        }
    }, [embeddedWallet])

    useEffect(() => {
        if (ready && !authenticated) {
          router.push("/");
        }
      }, [ready, authenticated]);

    const signOut = useCallback(async () => {
        disconnect()
    }, [disconnect])


    useEffect(() => {
        ;(async () => {
            if (isConnected && walletClient && publicClient) {
                const customSigner = walletClientToSmartAccountSigner(walletClient)

                const simpleSmartAccountClient = await signerToSimpleSmartAccount(
                    publicClient,
                    {
                        entryPoint: ENTRYPOINT_ADDRESS_V06,
                        signer: customSigner
                    }
                )

                const smartAccountClient = createSmartAccountClient({
                    account: simpleSmartAccountClient,
                    entryPoint: ENTRYPOINT_ADDRESS_V06,
                    chain: fuse,
                    bundlerTransport: http(pimlicoRpcUrl, {
                        timeout: 30_000
                    }),
                    middleware: {
                        gasPrice: async () => (await bundlerClient.getUserOperationGasPrice()).fast,
                        
                    },
                })

                setSmartAccountClient(smartAccountClient)
            }
        })()
    }, [isConnected, walletClient, publicClient])

    const onSendTransaction = (txHash: Hash) => {
        setTxHash(txHash)
    }

    if (smartAccountClient  && isConnected) {
        return (
            <div>
                <div>
                    Smart contract wallet address:{" "}
                    <p className="fixed left-0 top-0 flex flex-col w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
                        <code>{smartAccountClient.account?.address}</code>
                    </p>
                </div>
                <div className="flex gap-x-4">
                    <button
                        onClick={logout}
                        className="mt-6 flex justify-center items-center w-64 cursor-pointer border-2 border-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Sign out
                    </button>
                    <DemoTransactionButton
                        smartAccountClient={smartAccountClient}
                        onSendTransaction={onSendTransaction}
                    />
                </div>
                {txHash && (
                    <p className="mt-4">
                        Transaction hash:{" "}
                        <a
                            href={`https://explorer.fuse.io/tx/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            {txHash}
                        </a>
                    </p>
                )}
            </div>
        )
    }
}

export default loggedIn