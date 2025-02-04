import {
    // ActionExample,
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    // settings,
    State,
    type Action,
} from "@elizaos/core";
// import getInfoTokenOnSui from "../providers/coinMetaDataSui";
// import { getTokenOnSuiScan } from "../providers/getInfoCoinOnSuiScan";
import { searchCategoriesInFileJson } from "../providers/searchProjectInFileJson";
import { findTypesBySymbols } from "../providers/searchCoinInAggre";
import { GeckoTerminalProvider } from "../providers/coingeckoTerminalProvider";
import getActionHint from "../utils/action_hint";
import { SuiHTTPTransport } from "@mysten/sui/client";
import SuiOnChainProvider from "../providers/fetchSuiChain/suiOnChainProvider";
// import { RedisClient } from "@elizaos/adapter-redis";
const topMemeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
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



export const topMemeByHolders: Action = {
    name: "TOP_MEME_BY_HOLDERS",
    similes: [
        "TOP_MEME_TOKEN_BY_HOLDERS"

    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // Check if the necessary parameters are provided in the message

        // console.log("Message:", _message);
        return true;
    },
    description: "List top meme token by holders",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const topDefiContext = composeContext({
            state,
            template: topMemeTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context: topDefiContext,
            modelClass: ModelClass.SMALL,
        });
        const projectInfos = await searchCategoriesInFileJson("Meme");
        const projectType = await findTypesBySymbols(projectInfos);
        const suiOnChainProvider = new SuiOnChainProvider()
        const dataResponse = await suiOnChainProvider.fetchHolders(projectType);
        try {

            callback({
               text:`Here are the top Meme tokens by holders:`,
               action:"TOP_MEME_BY_HOLDERS",
               result: {
                type: "top_token_meme_by_holders",
                data:dataResponse.slice(0,content.size),
                action_hint:getActionHint()
            }
            })

            return true;
        } catch (error) {
            console.error("Error during token swap:", error);
            return false;
        }
    },
    examples: [

    ],
} as Action;


