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
    // generateObject,
    type Action,
} from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import { CoingeckoProvider } from "../providers/coingeckoProvider";
// import { formatObjectsToText } from "../utils/format";
const trendingPromptTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
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


export const trendingTokens: Action = {
    name: "TOP_TRENDING_TOKENS",

    description: "Get trending tokens",

    similes: [
        "SHOW_TRENDING_COINS",
        "GET_HOT_TOKENS",
        "FETCH_TRENDING_CRYPTO",
        "DISPLAY_POPULAR_TOKENS",
        "SHOW_WHATS_TRENDING",
        "GET_MOST_SEARCHED_TOKENS",
        "LIST_VIRAL_CRYPTOCURRENCIES",
        "SHOW_BUZZING_TOKENS",
        "GET_HYPED_COINS",
        "DISPLAY_TRENDING_GAINERS",
        "FETCH_TRENDING_MOVERS",
        "SHOW_TRENDING_MOMENTUM",
        "GET_VIRAL_TOKENS",
        "DISPLAY_TRENDING_MARKETS",
        "SHOW_BREAKOUT_TOKENS"
    ],

    examples: [

    ],

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
        elizaLogger.info("[trendingTokens]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const newsCryptoPannicContext = composeContext({
            state,
            template: trendingPromptTemplate,
        });
        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: newsCryptoPannicContext,
            modelClass: ModelClass.SMALL,
        });
        elizaLogger.info("content: ",content);
        const coinGecko = new CoingeckoProvider();
        const info = await coinGecko.getTrendingCoins();

        if (callback) {
            callback({
                text: `Below are ${content.size} trending coins we have collected:`,
                action: 'TOP_TRENDING_TOKENS',
                result: {
                    type: "trendingTokens",
                    data:info.slice(0,content.size)
                }
            });
        }

        return true;
    }
}
