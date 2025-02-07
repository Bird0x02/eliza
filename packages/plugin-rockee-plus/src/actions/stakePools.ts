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
    name: "STAKE_POOLS",
    similes: [
        "POOLS_STAKE"
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "List pools",
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
                user: "{{user1}}",
                content: {
                    text: "Stake pools",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Stake pools",
                    action: "STAKE_POOLS",

                },
            },
        ],
    ] as ActionExample[][],
} as Action;
