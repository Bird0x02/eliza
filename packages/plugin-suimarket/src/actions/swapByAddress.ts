import {
    ActionExample,
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
import getInfoTokenOnSui from "../providers/coinMetaDataSui";
import { getTokenOnSuiScan } from "../providers/getInfoCoinOnSuiScan";
import getActionHint from "../utils/action_hint";
// import { RedisClient } from "@elizaos/adapter-redis";
const swapTemplate = `Please extract the following swap details for SUI network:
{
    "inputTokenAddress": string | null,     // Token being sold (e.g. "0xb6a9f896fd6c0f777699b9aa2b1bb745caa5eb1f3978173c1ddffd4bdd3994e9::uni::UNI")
    "outputTokenAddress": string | null,    // Token being bought
    "amount": number | 0,               // Amount to swap
    "responseMessage": string,        // Flexible message to the user, translated into the user's language, e.g., "Please ensure all details are correct before proceeding with the swap to prevent any losses."
    "actionHintText": string          // Flexible message to the user, translated into the user's language, e.g., "Do you need any further assistance? Please let me know!"
}
Recent messages: {{recentMessages}}
\`\`\`
VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON
`;



export const executeSwapByAddress: Action = {
    name: "SUI_EXECUTE_SWAP_BY_ADDRESS",
    similes: [
        "SUI_SWAP_TOKENS_BY_ADDRESS",
        "SUI_TOKEN_SWAP_BY_ADDRESS",
        "SUI_TRADE_TOKENS_BY_ADDRESS",
        "SUI_EXCHANGE_TOKENS_BY_ADDRESS",

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
        // composeState
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const swapContext = composeContext({
            state,
            template: swapTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.SMALL,
        });
        console.log("content:", content);
        const inputTokenObject = await getInfoTokenOnSui(content.inputTokenAddress);

        if(inputTokenObject=== "ADDRESS_NOT_EXIST"){
            callback({
                text:`We do not support ${content.inputTokenAddress} token in SUI network yet, We only support swapping token symbol to token symbol or token address to token address.`,
             })
             return false
        }
        const outputTokenObject = await getInfoTokenOnSui(content.outputTokenAddress);
        if(outputTokenObject ==="ADDRESS_NOT_EXIST"){
            callback({
                text:`We do not support ${content.outputTokenAddress} token in SUI network yet, We only support swapping token symbol to token symbol or token address to token address.`,
             })
             return false
        }
        const imageFrom =await getTokenOnSuiScan(content.inputTokenAddress)
        const imageTo =await getTokenOnSuiScan(content.inputTokenAddress)
        const responseData = {
            amount: content.amount,
            fromToken: {...inputTokenObject,
                type: content.inputTokenAddress,
                imgUrl: imageFrom.iconUrl
            },
            toToken:{...outputTokenObject,
                type:content.outputTokenAddress,
                imgUrl: imageTo.iconUrl
            }

        }

        try {

            callback({
               text: content.responseMessage,
               action:"SUI_EXECUTE_SWAP_BY_ADDRESS",
               result: {
                type: "swap",
                data:responseData,
                action_hint:getActionHint(content.actionHintText)

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
                user: "{{user2}}",
                content: {
                    text: "Initiating swap of 10 SUI for USDT on SUI network...",
                    action: "SUI_EXECUTE_SWAP_BY_SYMBOL",
                    params: {
                        inputType: "0x2::sui::SUI",
                        outputType: "0x4fb3c0f9e62b5d3956e2f0e284f2a5d128954750b109203a0f34c92c6ba21247::coin::USDT",
                        amount: "10000000000", // Amount in base units
                        slippageBps: 50
                    }
                }
            }
        ]
    ] as ActionExample[][],
} as Action;
