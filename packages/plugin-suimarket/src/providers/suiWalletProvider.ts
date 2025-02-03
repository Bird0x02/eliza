import {
    IAgentRuntime,
    Memory,
    State,
    Provider,
    elizaLogger,
} from "@elizaos/core"


const suiWalletProvider: Provider = {
    get: async function (runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> {
        elizaLogger.info("[suiWalletProvider] loading ...");
        return "<suiWalletProvider>";
    }
}

export {suiWalletProvider}