import {
    ActionExample,
    // CacheOptions,
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
import {findByVerifiedAndSymbol} from "../providers/searchCoinInAggre";

import { hashUserMsg } from "../utils/format";
import getActionHint from "../utils/action_hint";

const swapTemplate = `
Recent messages: {{recentMessages}}
Extract the swap parameters from the conversation and wallet context above, follows these rules:
    - Return only a JSON object with the specified fields in thise format:
        {
            "inputTokenSymbol": string | null,     // Token being sold (e.g. "SUI")
            "outputTokenSymbol": string | null,    // Token being bought
            "amount": number | 0,               // Amount to swap

        }
    - Use null for any values that cannot be determined.
    - All property names must use double quotes
    - Null values should not use quotes
    - No trailing commas allowed
    - No single quotes anywhere in the JSON
    - Ensure that all token symbols are converted to uppercase.
`;

export const executeSwap: Action = {
    name: "SUI_EXECUTE_SWAP_BY_SYMBOL",
    similes: ["SUI_SWAP_TOKENS_BY_SYMBOL", "SUI_TOKEN_SWAP_BY_SYMBOL", "SUI_TRADE_TOKENS_BY_SYMBOL", "SUI_EXCHANGE_TOKENS_BY_SYMBOL"],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
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
        elizaLogger.info("compose history...");
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }
        const msgHash = hashUserMsg(message, "swap_symbol");
        let content:any = await runtime.cacheManager.get(msgHash);
        elizaLogger.info("---- cache info: ", msgHash, "--->", content);
        if(!content){
            const swapContext = composeContext({
                state,
                template: swapTemplate,
            });
            content = await generateObjectDeprecated({
                runtime,
                context: swapContext,
                modelClass: ModelClass.SMALL,
            });
            await runtime.cacheManager.set(msgHash, content, {expires: Date.now() + 300000});
        }
        elizaLogger.success("content:", content)
        const inputTokenObject = await findByVerifiedAndSymbol(content.inputTokenSymbol);
        if(!inputTokenObject){
            callback({
                text:`We do not support ${content.inputTokenSymbol} token in SUI network yet, We only support swapping token symbol to token symbol or token address to token address.`,
             })
             return false
        }
        const outputTokenObject = await findByVerifiedAndSymbol(content.outputTokenSymbol);
        if(!outputTokenObject){
            callback({
                text:`We do not support ${content.outputTokenSymbol} token in SUI network yet, We only support swapping token symbol to token symbol or token address to token address. `,
             })
             return false
        }
        const responseData = {
            amount: content.amount,
            fromToken: inputTokenObject,
            toToken:outputTokenObject

        }
        try {
            await callback({
               text:`Please ensure all details are correct before proceeding with the swap to prevent any losses.`,
               action:"SUI_EXECUTE_SWAP_BY_SYMBOL",
               result: {
                    type: "swap",
                    data: responseData,
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
        [
            {
                user: "{{user1}}",
                content: {
                    text:"Swap 10 SUI to USDC"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Initiating swap of 10 SUI for USDT on SUI network...",
                    action: "SUI_EXECUTE_SWAP_BY_SYMBOL",
                    params: {
                        inputTokenSymbol: "SUI",
                        outputTokenSymbol: "USDT",
                        amount: "10"
                    }
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    text:"Swap SUI to USDC"
                }
            },
            {
                "user": "{{user2}}",
                "content": {
                    "text": "Initiating swap CeTUS for deep on SUI network...",
                    "action": "SUI_EXECUTE_SWAP_BY_SYMBOL",
                    "params": {
                        "inputTokenSymbol": "SUI",
                        "outputTokenSymbol": "USDC",
                        "amount": "0"
                    }
                }
            }
            ]
    ] as ActionExample[][],
} as Action;