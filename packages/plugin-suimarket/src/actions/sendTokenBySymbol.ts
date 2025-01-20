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
import findByVerifiedAndSymbol from "../providers/searchCoinInAggre";
const sendTokenTemplate = `Please extract the following swap details for SUI network:

{
    "amount": number | null,               // Amount of tokens to transfer
    "tokenSymbol": string | null,          // Token symbol on the SUI network (e.g., "SUI", "UNI")
    "destinationAddress": string | null    // Recipient's wallet address
}

Recent messages: {{recentMessages}}

Extract the token transfer parameters from the conversation and wallet context above. Return only a JSON object with the specified fields. Use null for any values that cannot be determined.

Example Response:
{
    "amount": 10.5,
    "tokenSymbol": "UNI",
    "destinationAddress": "0xa3b1c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0"
}
\`\`\`
VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON


`;



export const sendTokenBySymbol: Action = {
    name:  "SUI_SEND_TOKEN_BY_SYMBOL",
    similes: [
        "SUI_TRANSFER_TOKENS_BY_SYMBOL",
        "SUI_TOKENS_SEND_BY_SYMBOL",
        "SUI_ASSET_SEND_BY_SYMBOL",
        "SUI_TOKENS_TRANSFER_BY_SYMBOL",
        "SUI_SEND_ASSETS_BY_SYMBOL",
        "SUI_TOKENS_TRANSFER_BY_SYMBOL",
        "SUI_ASSET_TRANSFER_BY_SYMBOL",
        "SUI_TOKENS_DISPATCH_BY_SYMBOL",
        "SUI_SEND_ASSETS_BY_SYMBOL",
        "SUI_TOKENS_SHIP_BY_SYMBOL",
        "SUI_TOKENS_DELIVER_BY_SYMBOL",
        "SUI_ASSET_SHIP_BY_SYMBOL",
        "SUI_TOKENS_SEND_OUT_BY_SYMBOL",
        "SUI_ASSET_DISPATCH_BY_SYMBOL",
        "SUI_ASSET_TRANSFER_OUT_BY_SYMBOL",
        "SUI_TOKENS_SEND_OUT_BY_SYMBOL",
        "SUI_ASSETS_DELIVER_BY_SYMBOL",


],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Check if the necessary parameters are provided in the message
        console.log("Message:", message);
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

        const sendTokenContext = composeContext({
            state,
            template: sendTokenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: sendTokenContext,
            modelClass: ModelClass.LARGE,
        });
        console.log("content:", content);

        const tokenObject = await findByVerifiedAndSymbol(content.tokenSymbol);
        if(!tokenObject){
            callback({
                text:`We do not support ${content.inputTokenSymbol} token in SUI network yet. However, if your token is supported, we can proceed with sending tokens using the token's address `,
             })
             return false
        }
        const responseData = {
            amount: content.amount,
            token_info: tokenObject,
            destinationAddress: content.destinationAddress
        }
        try {

            callback({
               text:`Send Tokens: \n Token Address: ${tokenObject.type}  ${content.tokenSymbol ? `\n Symbol: ${content.tokenSymbol}` : ""} \n To:   ${content.destinationAddress} \n Amount: ${content.amount} \n Please double-check all details before swapping to avoid any loss`,
               action:"SUI_SEND_TOKEN_BY_SYMBOL",
               result: {
                type: "send_sui_chain",
                data:responseData,
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
                    "amount": 10.5,
                    "tokenSymbol": "UNI",
                    "destinationAddress": "0xa3b1c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Send 10 UNI to 0xa3b1c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0",
                    action: "SUI_EXECUTE_SWAP_BY_SYMBOL",
                    params: {
                        "amount": 10.5,
                        "tokenSymbol": "UNI",
                        "destinationAddress": "0xa3b1c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0"
                    }
                }
            }
        ]
    ] as ActionExample[][],
} as Action;
