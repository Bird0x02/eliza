import {
    // ActionExample,
    // Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    type Action,
} from "@elizaos/core";

// import { formatObjectsToText } from "../utils/format";

import {  GeckoTerminalProvider } from "../providers/coingeckoTerminalProvider";
const listSuiPoolPromptTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Example response:
    \`\`\`json
    {
        size:1
    }
    \`\`\`
    {{recentMessages}}

    Extract ONLY from the current message (ignore any previous context or messages):

        Given the recent messages, extract the following information:

        size: Number of news items to return: Must be a positive integer Default is 1 if not specified Maximum value is 100 Minimum value is 1 If mentioned in message, use that number If not mentioned, use default value 10

        VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON

    Respond with a JSON markdown block containing only the extracted values.`;

export const suiTrendingPools: Action = {
    name: "SUI_TRENDING_POOLS",

    description: "Get pool from Sui network",

    similes: [
        "LIST_ALL_TOKENS_ON_SUI_NETWORK",
        "SHOW_SUI_TOKEN_STATISTICS",
        "GET_SUI_TOKEN_MARKET_OVERVIEW",
        "DISPLAY_TOP_TOKENS_ON_SUI",
        "SUI_TOKEN_RANKINGS",
        "SHOW_SUI_TOKEN_MARKET_DATA",
        "GET_SUI_TOKEN_MARKET_STATS",
        "DISPLAY_SUI_TOKEN_METRICS",
        "SUI_TOKEN_MARKET_SUMMARY",
        "SHOW_SUI_TOKEN_PERFORMANCE",
        "LIST_TRENDING_SUI_TOKENS",
        "GET_SUI_TOKEN_VOLUME_STATS",
        "DISPLAY_SUI_TOKEN_MARKET_ACTIVITY",
        "SHOW_SUI_TOKEN_TRADING_DATA",
        "GET_SUI_TOKEN_MARKET_ANALYSIS",
        "SUI_TRENDING_TOKEN"
    ],

    examples: [],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("[suiPools]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const suiPoolsContext = composeContext({
            state,
            template: listSuiPoolPromptTemplate,
        });
        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: suiPoolsContext,
            modelClass: ModelClass.SMALL,
        })
        elizaLogger.info("content: ",content);
        const coinGecko = new GeckoTerminalProvider();
        let info = await coinGecko.fetchPoolsByNetwork('sui-network');
        info = info.map(item => {
            item.name = item.name.split(" / ")[0];
            return item;
        });
        if (callback) {
            callback({
                text: `
🪙 List of Tokens in the Network

Here are the available tokens in the network. You can explore their details, market performance, and trading options:`,
                action: 'SUI_TRENDING_POOLS',
                result: {
                    type: "pools",
                    data:info.slice(0,content.size)


                }
            });
        }

        return true;
    }
}
