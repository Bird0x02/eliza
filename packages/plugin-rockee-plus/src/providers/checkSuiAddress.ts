import { SuiClient } from "@mysten/sui/client";

export async function checkSuiAddressExists(address) {
    const client = new SuiClient({ url: "https://fullnode.mainnet.sui.io" });
    try {
        const balance = await client.getBalance({ owner: address });
        return balance !== null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return false
    }


}