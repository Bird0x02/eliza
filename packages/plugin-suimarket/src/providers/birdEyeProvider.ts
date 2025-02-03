import {
    IAgentRuntime,
    Memory,
    State,
    Provider,
    elizaLogger,
} from "@elizaos/core"


const birdEyeProvider: Provider = {
    get: async function (runtime: IAgentRuntime, message: Memory, state?: State): Promise<string | null> {
        elizaLogger.info("loaded birdEye provider...");
        return "<birdeye info>";
    }
}

export {birdEyeProvider}