import {
    // ActionExample,
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
// import { formatObjectToText } from "../utils/format";
import { searchCoinInFileJsonProvider, searchCoinInFileJsonProvider2 } from "../providers/searchCoinIdInFileJson";

export interface InfoContent extends Content {
    coin_symbol: string;
    coin_name: string;
}

function isInfoContent(content: Content): content is InfoContent {
    console.log("Content for transfer", content);
    return (
        typeof content.coin_symbol === 'string' &&
        typeof content.coin_name === 'string'
    );
}

const coinInfoTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "coin_symbol": "btc"
    "coin_name":"Bitcoin"
}
\`\`\`


{{recentMessages}}

Based on the user's current question, extract the following cryptocurrency information:
    coin_symbol:
        Cryptocurrency symbol in lowercase format
        Return bitcoin if no valid cryptocurrency symbol is found
    coin_name:
        - Full name of the cryptocurrency with proper capitalization (e.g., Bitcoin, Ethereum, Solana)
        - Must match the corresponding symbol
        - Return Bitcoin if no valid cryptocurrency name is found

Only extract information explicitly mentioned in the current question. Do not use historical context or assumed information.
Respond with a JSON markdown block containing only the extracted values.`;

export const coinInfo: Action = {
    name: "GET_COIN_INFO_BY_SYMBOL",

    similes: [
       "GET_COIN",
        "COIN_DATA",
        "COIN_DETAILS",
        "SHOW_COIN",
        "CHECK_COIN",
        "COIN_STATUS",
        "COIN_LOOKUP",
        "FIND_COIN",
        "COIN_PRICE",
        "PRICE_CHECK",
        "GET_PRICE",
        "PRICE_INFO",
        "COIN_METRICS",
        "COIN_STATS",
        "COIN_INFORMATION",
        "PRICE_COIN"
    ],

    examples: [],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    description: "Get detail of token",

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("[tokenInfo]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const _schema = z.object({
            coin_symbol: z.string(),
            coin_name:z.string()
        });

        const _context = composeContext({
            state,
            template: coinInfoTemplate,
        });

        const content = await generateObject({
            runtime,
            context: _context,
            schema: _schema,
            modelClass: ModelClass.MEDIUM,
        });

        const parsedContent = content.object as InfoContent;


        if (!isInfoContent(parsedContent)) {
            console.error("Invalid content for coin info");
            if (callback) {
                callback({
                    text: "Unable to process coin info request. Invalid content provided.",
                    content: { error: "Invalid transfer content" },
                });
            }
            return false;
        }

        elizaLogger.info("[coinInfo] parsed content: ", parsedContent);


        let coinObject= await searchCoinInFileJsonProvider2(parsedContent.coin_symbol, parsedContent.coin_name)
        console.log("coinObject",coinObject)
        if(coinObject === null){
            coinObject= await searchCoinInFileJsonProvider(parsedContent.coin_symbol)
            if(coinObject === null){
                callback({
                    text: `I cant find infomation of coin symbol` ,

                });
                return false
            }

        }
        const coinGecko = new CoingeckoProvider();
        const info = await coinGecko.getToken(coinObject.id);
        elizaLogger.info("[coinInfo] details: ", JSON.stringify(info));

        if (callback) {
            callback({
                text: `${coinObject.name} is a cryptocurrency that operates on blockchain technology. Its price is determined by various factors, including supply, demand, and network activity.`,
                action: 'coinInfo',
                result: {
                    type:"info_coin",
                    data:info
                }
            });
        }

        return true;
    }
}

