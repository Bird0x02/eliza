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
import getTransactionInfo from "../providers/checkTxHash";
import getActionHint from "../utils/action_hint";
const checkTxHashTemplate = `Please extract the following swap details for SUI network:
{
    "txHash": string  | null,                // txHash is transaction block on sui network
}
Recent messages: {{recentMessages}}
Retrieve and return the transaction details using the given txHash. The response should be a JSON object with the specified field. If the txHash is unavailable or invalid, return null.
All property names must use double quotes
All string values must use double quotes
null values should not use quotes
No trailing commas allowed
No single quotes anywhere in the JSON


`;



export const checkTxhashOnSui: Action = {
    name: "CHECK_TXHASH_SUI_NETWORK",
    similes: [
        "SUI_VERIFY_TXHASH",
        "SUI_GET_TRANSACTION_DETAILS",
        "SUI_LOOKUP_TXHASH",
        "SUI_FETCH_TXHASH_INFO",
        "SUI_QUERY_TRANSACTION",
        "SUI_CHECK_TX_STATUS",
        "SUI_INSPECT_TXHASH",
        "SUI_RETRIEVE_TXHASH_DATA",
        "SUI_ANALYZE_TRANSACTION",
        "SUI_SCAN_TXHASH"
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        // Check if the necessary parameters are provided in the message
        // console.log("Message:", message);
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

        const checkTxHashContext = composeContext({
            state,
            template: checkTxHashTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: checkTxHashContext,
            modelClass: ModelClass.SMALL,
        });
        console.log("content:", content);



        try {
            const checkInfoTxHash = await getTransactionInfo(content.txHash);
            callback({
               text:`Your transaction status for txhash ${content.txHash} is ${checkInfoTxHash.effects.status.status}.`,
               action:"CHECK_TXHASH_SUI_NETWORK",
               result: {
                type: "info_txhash",
                data: checkInfoTxHash,
                action_hint:getActionHint()

            }
            })
            return true;
        } catch (error) {
            callback({
                text: `Your transaction status for txhash ${content.txHash} is fail`,
                action:"CHECK_TXHASH_SUI_NETWORK",
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
             })
            console.error("Error during token swap:", error);
            return false;
        }
    },
    examples: [
        [
            {
                "user": "{{user1}}",
                "content": {
                    "txHash": "9XbGmKRrX2cYeHiY4LJDdHNY77c3MzBrMKpxz3F5BV2E"
                }
            },
            {
                "user": "{{user2}}",
                "content": {
                    "text": "Fetching transaction details for txHash: 9XbGmKRrX2cYeHiY4LJDdHNY77c3MzBrMKpxz3F5BV2E...",
                    "action": "SUI_CHECK_TXHASH",
                    "params": {
                        "txHash": "9XbGmKRrX2cYeHiY4LJDdHNY77c3MzBrMKpxz3F5BV2E"
                    }
                }
            }
        ],
        [
            {
                "user": "{{user1}}",
                "content": {
                    "txHash": "9XbGmKRrX2cYeHiY4LJDdHNY77c3MzBrMKpxz3F5BV2E"
                }
            },
            {
                "user": "{{user2}}",
                "content": {
                    "text": "check txhash 3LvEnUFK7qxTU4Wh3CwgUhJJowiuMAiyNhyMDpteAknC",
                    "action": "SUI_CHECK_TXHASH",
                    "params": {
                        "txHash": "3LvEnUFK7qxTU4Wh3CwgUhJJowiuMAiyNhyMDpteAknC"
                    }
                }
            }
        ]
    ] as ActionExample[][],
} as Action;
