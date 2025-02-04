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
// import { z } from "zod";

import { CoingeckoProvider } from "../providers/coingeckoProvider";
import { formatObjectsToText } from "../utils/format";
const topMarketPromptTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Example response:
    \`\`\`json
    {
        size:1
    }
    \`\`\`
    {{recentMessages}}

    Extract ONLY from the current message (ignore any previous context or messages):

        Given the recent messages, extract the following information:

        size: Number of news items to return: Must be a positive integer Default is 1 if not specified Maximum value is 100 Minimum value is 1 If mentioned in message, use that number If not mentioned, use default value 1

        VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON

    Respond with a JSON markdown block containing only the extracted values.`;
;
export const trendingCat: Action = {
    name: "trendingCategories",
    similes: [
        "SHOW_HOT_CATEGORIES",
        "LIST_TRENDING_SECTORS",
        "DISPLAY_POPULAR_CATEGORIES",
        "WHAT_CATEGORIES_ARE_TRENDING",
        "TOP_PERFORMING_SECTORS"
    ],

    examples: [
    ],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    description: "Get trending categories",

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("[trendingCat]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const topMarketsContext = composeContext({
                    state,
                    template: topMarketPromptTemplate,
                });
                // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: topMarketsContext,
            modelClass: ModelClass.LARGE,
        });
        console.log(content);

        let coinGecko = new CoingeckoProvider();
        let info = await coinGecko.getTrendingCategories();

        if (callback) {
            callback({
                text: `trending cat:` + (await formatObjectsToText(info)),
                action: 'trendingCat',
                result: {
                    type: "trendingCat",
                    data: info.slice(0,content.size)
                }
            });
        }

        return true;
    }
}
