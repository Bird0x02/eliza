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
        "token_address": "0x7123ef5ec546c363f270ef770472dfad231eeb86469a2d1fba566d6fd74cb9e1::craft::CRAFT"
    }
    \`\`\`
{{recentMessages}}

Given the recent messages, extract the following information:

token_address:
    Recognizes that token_address is a unique contract identifier on the blockchain (e.g., 0x...::module::TOKEN_NAME).
    Extract the full contract address of the token.
    Must be a string.
    Include the module and token name if present.
    Default is null if not specified.
`

export const suiTokenPriceByAddress: Action = {
    name: "TOKEN_PRICE_INFO_BY_ADDRESS",

    description: "price of token address on sui",

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

    examples: [
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "0x94e7a8e71830d2b34b3edaa195dc24c45d142584f06fa257b73af753d766e690::celer_wbtc_coin::CELER_WBTC_COIN price"
                }
            },
            {
                "user": "{{user2}}",
                "content": {
                    "text": "price",
                    "action": "TOKEN_PRICE_INFO_BY_ADDRESS",
                    "params": {
                        "token_address": "0x94e7a8e71830d2b34b3edaa195dc24c45d142584f06fa257b73af753d766e690::celer_wbtc_coin::CELER_WBTC_COIN"
                    }
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "price 0x94e7a8e71830d2b34b3edaa195dc24c45d142584f06fa257b73af753d766e690::celer_wbtc_coin::CELER_WBTC_COIN"
                }
            },
            {
                "user": "{{user2}}",
                "content": {
                    "text": "price {TOKEN_ADDRESS}",
                    "action": "TOKEN_PRICE_INFO_BY_ADDRESS",
                    "params": {
                        "token_address": "{TOKEN_ADDRESS}"
                    }
                }
            }
        ]


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
        elizaLogger.info("[suiPools]");

        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const tokenPricePromptTemplateContext = composeContext({
            state,
            template: promptSuiTokenInfoTemplate,
        });
        // Generate transfer content
        const content = await generateObjectDeprecated({
            runtime,
            context: tokenPricePromptTemplateContext,
            modelClass: ModelClass.SMALL,
        })
        elizaLogger.info("content: ",content);
        const info = await getTokenOnSuiScan(content.token_address);

        if (callback) {
            callback({
                text: `Here are the token prices:`,
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
                    action_hint:getActionHint()
                }
            });
        }

        return true;
    }
}
