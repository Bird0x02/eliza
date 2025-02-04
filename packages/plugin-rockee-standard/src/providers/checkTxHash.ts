import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
const client = new SuiClient({ url: getFullnodeUrl("mainnet") });


export default async function getTransactionInfo(txHash) {
    try {
        const txDetails = await client.getTransactionBlock({
            digest: txHash,
            options: {
                showEffects: true,
                showInput: true,
                showEvents: true
            }
        });
        return txDetails;

    } catch (error) {
        console.log("getTransactionInfo ",error)
        throw Error("ERR_CHECK_TXHASH")
    }
}