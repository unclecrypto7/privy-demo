
import { SmartAccountClient } from "permissionless"
import { SmartAccount } from "permissionless/accounts"
import { ENTRYPOINT_ADDRESS_V06_TYPE } from "permissionless/types"
import { useState } from "react"
import { Chain, Hash, Transport, zeroAddress } from "viem"

const DemoTransactionButton = ({
    smartAccountClient,
    onSendTransaction
}: {
    smartAccountClient: SmartAccountClient<ENTRYPOINT_ADDRESS_V06_TYPE>
    onSendTransaction: (txHash: Hash) => void
}) => {

    const sendTransaction = async () => {
        const txHash = await smartAccountClient.sendTransaction({
            // @ts-ignore
            account: smartAccountClient.account,
            to: zeroAddress,
            data: "0x",
            value: BigInt(0)
        })
        onSendTransaction(txHash)
    }

    return (
        <div>
            <button
                onClick={sendTransaction}
                className="mt-6 w-full flex justify-center items-center cursor-pointer  bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
                {<p className="mr-4">Demo transaction</p>}
            </button>
        </div>
    )
} 

export default DemoTransactionButton;