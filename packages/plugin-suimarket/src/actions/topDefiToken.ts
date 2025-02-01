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
// import { RedisClient } from "@elizaos/adapter-redis";
const topDefiTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
Example response:
\`\`\`json
{
    size:5,
    "responseMessage": string,        // Flexible message to the user, translated into the user's language, e.g., "Here are the top DeFi tokens:"
    "actionHintText": string          // Flexible message to the user, translated into the user's language, e.g., "Do you need any further assistance? Please let me know!"
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



export const topDefi: Action = {
    name: "TOP_DEFI",
    similes: [
        "TOP_DEFI_TOKEN"

    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // Check if the necessary parameters are provided in the message

        // console.log("Message:", _message);
        return true;
    },
    description: "Perform a token swap.",
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
            template: topDefiTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context: topDefiContext,
            modelClass: ModelClass.SMALL,
        });

        const projectInfos = await searchCategoriesInFileJson("Defi");
        const projectType = await findTypesBySymbols(projectInfos);
        const GeckoTerminal = new GeckoTerminalProvider();

        const tokenInfo = await GeckoTerminal.fetchMultipleTokenOnNetwork("sui-network",projectType);
        let dataResponse = tokenInfo.data.map((data) => ({
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
               text:`${content.responseMessage}`,
               action:"TOP_DEFI",
               result: {
                type: "top_token",
                data: dataResponse.slice(0, content.size),
                action_hint:{
                    text: content.actionHintText,
                    actions:[
                        {
                            type:"button_buy",
                            text:"Buy ROCK",
                            data:{
                                type:"0xb4bc93ad1a07fe47943fc4d776fed31ce31923acb5bc9f92d2cab14d01fc06a4::ROCK::ROCK",
                                icon_url:"https://rockee.ai/images/logo.png"
                            }
                        },
                        {
                            type:"button_buy",
                            text:"Buy Sui",
                            data:{
                                type:"0xb4bc93ad1a07fe47943fc4d776fed31ce31923acb5bc9f92d2cab14d01fc06a4::ROCK::ROCK",
                                icon_url:"https://strapi-dev.scand.app/uploads/sui_c07df05f00.png"
                            }
                        },
                    ]
                }
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


