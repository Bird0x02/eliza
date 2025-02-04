import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    elizaLogger,
    generateObject,
    type Action,
} from "@elizaos/core";
import { z } from "zod";

import { CoingeckoProvider } from "../providers/coingeckoProvider";
import { formatObjectsToText } from "../utils/format";

const template = `You are an expert AI crypto token analyst. Evaluate if the given token description represents a legitimate AI-focused crypto project.

Input Description: {{tokenDescription}}

Consider these key validation points:
1. Clear AI implementation
2. Blockchain/crypto integration
3. Token utility purpose
4. Technical feasibility

Return a simple yes/no response in this JSON structure:

{
  "isValidAIToken": boolean,
  "confidence": number
}`;

export const topAiTokens: Action = {
    name: "topAiTokens",

    similes: [
        "show ai cryptocurrencies",
        "list artificial intelligence tokens",
        "get ai crypto projects",
        "display ai coins",
        "fetch ai related tokens",
        "show machine learning tokens",
        "get neural network coins",
        "list top ai cryptos",
        "display artificial intelligence coins",
        "show ai blockchain tokens",
        "fetch ai technology coins",
        "get cognitive computing tokens",
        "show ai platform coins",
        "list ai infrastructure tokens",
        "display ai ecosystem coins"
      ],

    examples: [],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    description: "Retrieves a list of top AI-focused cryptocurrency tokens including price, market cap, and key metrics",

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("[topAiTokens]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        let coinGecko = new CoingeckoProvider();
        let info = await coinGecko.topAiTokens(runtime, message, state);

        if (callback) {
            callback({
                text: `[topAiTokens]` + (await formatObjectsToText(info)),
                action: '[topAiTokens]'
            });
        }

        return true;
    }
}
