import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    Action
} from "@elizaos/core";

export const bestTrader: Action = {
  name: 'bestTrader',
  description: 'Get trader with the best portfolio performance',
    handler: async (runtime: IAgentRuntime,
                    message: Memory,
                    state: State,
                    options: { [key: string]: unknown },
                    callback: HandlerCallback) => {
        try{
            elizaLogger.log("[portfolio] Handle with message ...");
            callback({
              text: "It's must be you!!!",
              attachments: []
            })
            elizaLogger.log("[portfolio] Handle with message ...DONE");
            return [];
        }
        catch(error){
            elizaLogger.error("[portfolio] %s", error);
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    //   elizaLogger.log("[portfolio] Validating ...");
    //   elizaLogger.log("[portfolio] Validating ...DONE");
      return true;
    },
    similes:["portfolio_best", "portfolio_infulencer", "top_portfolio"],
    examples: []
};