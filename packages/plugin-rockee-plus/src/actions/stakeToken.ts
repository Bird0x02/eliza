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
import getActionHint from "../utils/action_hint";
import { listPoolsInFileJson } from "../providers/searchPoolInFile";
// // import { RedisClient } from "@elizaos/adapter-redis";

export const stakePoolsNavi: Action = {
    name: "STAKE_TOKEN",
    similes: [
        "TOKEN_STAKE",
        "STAKE_{INPUT}",
    ],
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
        // composeState
        // if (!state) {
        //     state = (await runtime.composeState(message)) as State;
        // } else {
        //     state = await runtime.updateRecentMessageState(state);
        // }

        // const swapContext = composeContext({
        //     state,
        //     template: swapTemplate,
        // });

        // const content = await generateObjectDeprecated({
        //     runtime,
        //     context: swapContext,
        //     modelClass: ModelClass.SMALL,
        // });
        let responseData = await listPoolsInFileJson();
        try {
            callback({
               text: "Below is a list of stake pools:",
               action:"STAKE_POOLS",
               result: {
                type: "stake_pools",
                data:responseData,
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
