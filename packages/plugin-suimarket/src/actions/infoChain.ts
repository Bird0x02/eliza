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
    generateObjectDeprecated,
    type Action,
} from "@elizaos/core";


export interface InfoContent extends Content {
    coin_symbol: string;
    coin_name: string;
}



const chainInfoTemplate = `"Give me detailed information about [Blockchain Name], including its consensus mechanism, block time, average transaction fees, number of nodes, scalability, and key projects running on this chain."

Extracted Text to Display Outside Chat:

"Detailed Information About [Blockchain Name]:

Consensus Mechanism:
Block Time:
Average Transaction Fees:
Number of Nodes:
Scalability:
Key Projects Running on This Chain:"`;



export const chainInfo: Action = {
    name: "SUI_GET_CHAIN_INFO",

    similes: [
       "SUI_GET_NETWORK_INFO",

    ],

    examples: [],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    description: "Get detailed information about a blockchain network.",

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

        const _context = composeContext({
            state,
            template: chainInfoTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: _context,
            modelClass: ModelClass.MEDIUM,
        });
        console.log("content",content);

        if (callback) {
            callback({
                text: content,
            });
        }

        return true;
    }
}

