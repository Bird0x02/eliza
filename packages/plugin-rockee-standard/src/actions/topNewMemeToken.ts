import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    elizaLogger,
    type Action,
} from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import { CoingeckoProvider } from "../providers/coingeckoProvider";
import getActionHint from "../utils/action_hint";
const trendingPromptTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
Example response:
\`\`\`json
{
    size:5
}
\`\`\`
{{recentMessages}}
Extract ONLY from the current message (ignore any previous context or messages):
    Given the recent messages, extract the following information:
    size: Number of news items to return: Must be a positive integer Default is 5 if not specified Maximum value is 100 Minimum value is 1 If mentioned in message, use that number If not mentioned, use default value 5
VALIDATION RULES:
    All property names must use double quotes
    All string values must use double quotes
    null values should not use quotes
    No trailing commas allowed
    No single quotes anywhere in the JSON
Respond with a JSON markdown block containing only the extracted values.`;


export const topNewMemeToken: Action = {
    name: "TOP_NEW_MEME_TOKEN",

    description: "TOP NEW MEME TOKEN",

    similes: [

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
        const info = await coinGecko.topNewMeMeCoin();
        if (callback) {
            callback({
                text: `Below are ${content.size} trending coins we have collected:`,
                action: 'TOP_TRENDING_TOKENS',
                result: {
                    type: "sui_new_meme_coin",
                    data:info.slice(0,content.size)
                },
                action_hint:getActionHint()
            });
        }

        return true;
    }
}
