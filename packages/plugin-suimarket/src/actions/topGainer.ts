import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    Action
} from "@elizaos/core";

export const topGainer: Action = {
  name: 'topGainer',
  description: 'Get the top gainer trading code today',
  handler: async (runtime: IAgentRuntime,
                  message: Memory,
                  state: State,
                  options: { [key: string]: unknown },
                  callback: HandlerCallback) => {
      try{
          elizaLogger.info("[topgainer] Handle with message ...");
          callback({
            text: "It's must be you!!!",
            attachments: []
          })
          elizaLogger.info("[topgainer] Handle with message ...DONE");
          return [];
      }
      catch(error){
          elizaLogger.error("[topgainer] %s", error);
          return false;
      }
  },
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    elizaLogger.info("[topgainer] Validating ...");
    elizaLogger.info("[topgainer] Validating ...DONE");
    return true;
  },
  similes:["top_gainer", "gainer today"],
  examples: []
};