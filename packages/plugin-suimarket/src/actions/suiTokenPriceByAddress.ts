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

// import {  formatObjectToText } from "../utils/format";

// import GeckoTerminalProvider2 from "../providers/coingeckoTerminalProvider2";
import { getTokenOnSuiScan } from "../providers/getInfoCoinOnSuiScan";
import getActionHint from "../utils/action_hint";

const promptSuiTokenInfoTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
    \`\`\`json
    {
        "token_address": "0x7123ef5ec546c363f270ef770472dfad231eeb86469a2d1fba566d6fd74cb9e1::craft::CRAFT",
        "responseMessage": string,        // Flexible message to the user, translated into the user's language, e.g., "Here are the token prices:"
        "actionHintText": string          // Flexible message to the user, translated into the user's language, e.g., "Do you need any further assistance? Please let me know!"
    }
    \`\`\`
{{recentMessages}}
Extract ONLY from the current message (ignore any previous context or messages):

Given the recent messages, extract the following information:

token_address:

Full contract address of the token
Must be a string
Include module and token name if present
Default is null if not specified

VALIDATION RULES:

All property names must use double quotes
All string values must use double quotes
null values should not use quotes
No trailing commas allowed
No single quotes anywhere in the JSON
Respond with a JSON markdown block containing only the extracted values.`

export const suiTokenPriceByAddress: Action = {
    name: "TOKEN_PRICE_INFO_BY_ADDRESS",

    description: "pRICE OF TOKEN address ON sui",

    similes: [
        "{INPUT}_PRICE",
        "PRICE_{INPUT}",
        "HOW_ABOUT_{INPUT}_PRICE",
        "{INPUT}_COST",
        "COST_OF_{INPUT}",
        "WHAT_IS_{INPUT}_PRICE",
        "CHECK_{INPUT}_PRICE",
        "{INPUT}_MARKET_PRICE",
        "HOW_MUCH_IS_{INPUT}",
        "LATEST_{INPUT}_PRICE",
        "CURRENT_{INPUT}_RATE",
        "VALUE_OF_{INPUT}",
        "{INPUT}_EXCHANGE_RATE",
        "CAN_YOU_TELL_ME_{INPUT}_PRICE",
        "WHAT_ABOUT_{INPUT}_RATE",
        "{INPUT}_WORTH",
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
        elizaLogger.log("[suiPools]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const searchSuiTokenSymbolPromptTemplateContext = composeContext({
            state,
            template: promptSuiTokenInfoTemplate,
        });
        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: searchSuiTokenSymbolPromptTemplateContext,
            modelClass: ModelClass.SMALL,
        })
        elizaLogger.log("content: ",content);
        const info = await getTokenOnSuiScan(content.token_address);
        console.log(info)
        if (callback) {
            callback({
                text: content.responseMessage,
                action: 'TOKEN_PRICE_INFO_BY_ADDRESS',
                result: {
                    type: "token_price",
                    data:{
                        symbol: info.symbol,
                        name: info.name,
                        market_cap:  info.marketCap,
                        price: info.tokenPrice,
                        icon_url: info.iconUrl,
                    },
                    action_hint:getActionHint(content.actionHintText)
                }
            });
        }

        return true;
    }
}
