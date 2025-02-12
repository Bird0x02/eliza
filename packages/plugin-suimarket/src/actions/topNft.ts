import {
    // ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    composeContext,
    // elizaLogger,
    generateObjectDeprecated,
    type Action,
} from "@elizaos/core";
// import { fetchTopDexByNetwork } from "../providers/topDex";
// import { hashUserMsg } from "../utils/format";
// import { getTopDexOnSuiScan } from "../providers/getTopDexOnSuiScan";
// import {RedisClient} from "@elizaos/adapter-redis"
import SuiOnChainProvider from "../providers/fetchSuiChain.ts/Nft";
export interface InfoContent extends Content {
    coin_symbol: string;
    coin_name: string;
}

const topNftPromptTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
Example response:
\`\`\`json
{
    size:5,
    "actionHintText": string,          // Flexible message to the user, translated into the user's language, e.g., "Do you need any further assistance? Please let me know!"
    "responseMessage": string,        // Flexible message to the user, translated into the user's language, e.g., "The top DEX on"
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


export const topNftInfos: Action = {
    name: "TOP_NFT_ON_SUI_CHAIN",
    description: "Get top nft on sui chain.",
    similes: [
        "FIND_TOP_NFT",
        "SHOW_TOP_NFT",
        "GET_TOP_NFT",
        "TOP_NFT_ON_SUI",
        "TOP_NFT_BY_VOLUME",
        "TOP_NFT_BY_HOLDERS",
        "TRENDING_NFT_SUI",
        "BEST_NFT_ON_SUI",
        "HOTTEST_NFT_SUI",
        "MOST_TRADED_NFT_SUI"
    ]
    ,

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

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const _context = composeContext({
            state,
            template: topNftPromptTemplate,
        });

        const swapContext = composeContext({
            state,
            template: _context,
        })
        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.SMALL,
        })
        const nft = new SuiOnChainProvider()
        const responseData = await nft.fetchCollectionNft()
        callback({
                    text: `The top DEX on ${content.network_blockchain}`,
                    action:"TOP_NFT",
                        result: {
                        type: "top_nft",
                        data:responseData.content,
                    },
                    action_hint:{
                        text: "Do you need any further assistance? Please let me know!",
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
                });


        return true;
    }
}

