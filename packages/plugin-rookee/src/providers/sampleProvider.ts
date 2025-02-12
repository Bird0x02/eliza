import {
    Provider,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
} from "@elizaos/core";

export const sampleProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        // Data retrieval logic for the provider
        console.log(runtime, message, state);
        elizaLogger.log("Retrieving data in sampleProvider...");
    },
};
