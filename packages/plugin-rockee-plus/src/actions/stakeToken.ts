import {
    ActionExample,
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
import getActionHint from "../utils/action_hint";
import { searchPoolInFileJson } from "../providers/searchPoolInFile";
// // import { RedisClient } from "@elizaos/adapter-redis";
const stakeTokenTemplate = `
Recent messages: {{recentMessages}}
Extract the swap parameters from the conversation and wallet context above, follows these rules:
Recognized Pools in NAVI: SUI, USDT, WETH, CETUS, VoloSui, HaedalSui, NAVX, WBTC, AUSD, wUSDC, nUSDC, ETH, USDY, NS, stBTC, DEEP, FDUSD, BLUE, BUCK, suiUSDT, stSUI, suiBTC.
    - Return only a JSON object with the specified fields in thise format:
        {
            "pool_name": string | NAVX,
        }
    - Use null for any values that cannot be determined.
    - All property names must use double quotes
    - Null values should not use quotes
    - No trailing commas allowed
    - No single quotes anywhere in the JSON
`;
export const stakeTokenPoolsNavi: Action = {
    name: "STAKE_TOKEN",
    similes: [
        "TOKEN_STAKE",
        "STAKE_{INPUT}",
    ],
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },
    description: "Stake by token",
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

        const stakeTokenContext = composeContext({
            state,
            template: stakeTokenTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: stakeTokenContext,
            modelClass: ModelClass.SMALL,
        });
        elizaLogger.info("content:",content)
        let responseData = await searchPoolInFileJson(content.pool_name);
        try {
            callback({
               text: "Below is a list of stake pools:",
               action:"STAKE_TOKEN",
               result: {
                type: "stake_token",
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
                    text: "Stake USDC",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Stake USDC",
                    action: "STAKE_TOKEN",

                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Stake {TOKEN_SYMBOL}",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Stake {TOKEN_SYMBOL}",
                    action: "STAKE_TOKEN",

                },
            },
        ]
    ] as ActionExample[][],
} as Action;
