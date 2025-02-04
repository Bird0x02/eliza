import {
  ActionExample,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  ModelClass,
  State,
  composeContext,
  elizaLogger,
  generateObject,
  type Action,
} from "@elizaos/core";

import { z } from "zod";


const template = `You are an expert AI crypto token analyst. Evaluate if the given token description represents a legitimate AI-focused crypto project.

Input Description: {{recentMessages}}

Consider these key validation points:
1. Clear AI implementation
2. Blockchain/crypto integration
3. Token utility purpose
4. Technical feasibility

Return a simple yes/no response in this JSON structure:

{
  "isValidAIToken": boolean,
  "confidence": number
}`;

export interface MatchContent extends Content {
  isValidAIToken: boolean;
  confidence: number;
}

export async function match(runtime: IAgentRuntime, message: Memory, state: State, text: string): Promise<MatchContent> {
    const transferSchema = z.object({
      isValidAIToken: z.boolean(),
      confidence: z.union([z.string(), z.number()]),
    });

    const transferContext = composeContext({
        state,
        template: template,
    });

    const content = await generateObject({
        runtime,
        context: transferContext,
        schema: transferSchema,
        modelClass: ModelClass.SMALL,
    });

    return (content.object as MatchContent);
}



