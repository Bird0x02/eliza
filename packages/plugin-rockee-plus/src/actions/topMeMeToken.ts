import {
    // ActionExample,
    composeContext,
    elizaLogger,
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
// import { RedisClient } from "@elizaos/adapter-redis";
import SuiOnChainProvider from "../providers/fetchSuiChain/suiOnChainProvider";
const topMemeTemplate = `
Recent messages: {{recentMessages}}
Extract the swap parameters from the conversation and wallet context above, follows these rules:
    - Return only a JSON object with the specified fields in thise format:
        {
            "size": number | 5  ,  // Number of records
            "sortBy": ""         // Sorting criteria
        }
    - Use null for any values that cannot be determined.
    - All property names must use double quotes
    - Null values should not use quotes
    - No trailing commas allowed
    - No single quotes anywhere in the JSON
    - Ensure that sortBy is one of the following values: "MCAP", "24VOL", "PRICE_INCREASE", "PRICE_DECREASE", "HOLDERS", "MARKET_CAP", "24HVOLUME".
`
export const topMeme: Action = {
    name: "TOP_MEME",
    similes: [
        "TOP_MEME_TOKEN"

    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // Check if the necessary parameters are provided in the message

        // console.log("Message:", _message);
        return true;
    },
    description: "List top meme token",
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
        console.log("content:", content);
        let dataResponse;
        if(content.sortBy!=="HOLDERS"){
            const projectInfos = await searchCategoriesInFileJson("Meme");
            const projectType = await findTypesBySymbols(projectInfos);
            const GeckoTerminal = new GeckoTerminalProvider();
            const tokenInfo = await GeckoTerminal.fetchMultipleTokenOnNetwork("sui-network",projectType);
            dataResponse = tokenInfo.data.map((data) => ({
                volume_usd: data.attributes.volume_usd?.h24 || 0,
                symbol: data.attributes.symbol,
                price: data.attributes.price_usd,
                icon_url: data.attributes.image_url,
                name: data.attributes.name ? data.attributes.name.split(" / ")[0] : "N/A",
                market_cap: data.attributes.market_cap_usd || 0,
                price_change_percentage: "N/A",
            }));

            tokenInfo.included.forEach((includedData) => {
                const name = includedData.attributes.name.split(" / ")[0];
                const price_change = includedData.attributes.price_change_percentage.h24 || "N/A";
                const matchedToken = dataResponse.find((token) => token.symbol === name);
                if (matchedToken) {
                    matchedToken.price_change_percentage = price_change;
                }
            });
            try {

                callback({
                   text:`Here are the top Meme tokens:`,
                   action:"TOP_MEME",
                   result: {
                    type: "top_token",
                    data:dataResponse.slice(0,5),
                    action_hint:getActionHint()
                }
                })

                return true;
            } catch (error) {
                elizaLogger.info("Error top meme token:", error);
                return false;
            }
        }
        else{
            const projectInfos = await searchCategoriesInFileJson("Meme");
            const projectType = await findTypesBySymbols(projectInfos);
            const suiOnChainProvider = new SuiOnChainProvider()
            const dataResponse = await suiOnChainProvider.fetchHolders(projectType.slice(0,content.size));
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
            }
            catch (error) {
                elizaLogger.info("Error top meme token:", error);
                return false;
            }
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "show me top 5 meme token by holders",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Top meme token",
                    action: "TOP_MEME",
                    content: {
                        "size": 5 ,  // Number of records
                        "sortBy": "HOLDERS"
                    },
                },
            },
        ],
    ],
} as Action;


