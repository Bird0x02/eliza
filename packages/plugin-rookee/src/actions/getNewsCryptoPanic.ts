import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    Action,
    ActionExample,
    ModelClass
} from "@elizaos/core";
// import axios from 'axios';
// import { callApi } from "../axios";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";


const newsCyptoPanicTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    currencies:"BTC,ETH",
    kind: "all",
    filter: "hot"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information:

currencies: Cryptocurrency symbols (default options: BTC, ETH, SUI)
kind: Content type (must be one of: all, news, media; if not specified, use default: "all")
filter: Content category (must be one of: rising, hot, bullish, bearish, important, saved, lol; if not specified, use default: "hot")

Respond with a JSON markdown block containing only the extracted values.`;



export  const getNewsCryptoPanic: Action = {
  name: 'analyzeCryptoNewsPanic',
  description: 'provide news analysis deeply into crypto markets',
    handler: async (runtime: IAgentRuntime,
                    message: Memory,
                    state: State,
                    options: { [key: string]: unknown },
                    callback: HandlerCallback) => {
        try{

            // Initialize or update state
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            const newsCryptoPannicContext = composeContext({
                state,
                template: newsCyptoPanicTemplate,
            });
            // Generate transfer content
            const content = await generateObjectDeprecated({
                runtime,
                context: newsCryptoPannicContext,
                modelClass: ModelClass.LARGE,
            });
            elizaLogger.log("content: ",content);
            // elizaLogger.log("content: ",typeof content);
            const urlCryptoPanic = `${process.env.CRYPTO_PANIC_URL}` || "https://cryptopanic.com/api/free/v1/posts";

            if(!content){
                return true;
            }
            content.auth_token = process.env.CRYPTO_PANIC_API_KEY;

            if(content.currencies === null){
                content.currencies = "BTC,ETH,SOL";
            }
            if(content.kind === "all"){
                delete content.kind;
            }

            const requestOptions = {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },

                };
            const queryString = new URLSearchParams(content).toString();


            const response = await fetch(`${urlCryptoPanic}?${queryString}`, requestOptions);
                if (!response.ok) {
                    elizaLogger.error("API Response:", await response.text()); // Debug log
                    throw new Error(
                        `Embedding API Error: ${response.status} ${response.statusText}`
                    );
                }
            const data:any = await response.json()

            let responseMessage = "All News today:\n- ";
            responseMessage += data.results.map((item:any) => item.title).join("\n- ");
            callback({
                text: responseMessage,
                attachments: []
              })
            // elizaLogger.log("[coingecko] Handle with message ...DONE!");
            return true;
        }
        catch(error){
            elizaLogger.error("[coingecko] %s", error);
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
      elizaLogger.log("[news] Validating ...");
      elizaLogger.log("[news] Validating ...DONE");
      return true;
    },
    similes: [
        "ANALYZE_CRYPTO_MARKET_NEWS",
        "RESEARCH_CRYPTOCURRENCY_UPDATES",
        "EVALUATE_DIGITAL_ASSET_NEWS",
        "EXAMINE_BLOCKCHAIN_DEVELOPMENTS",
        "INVESTIGAT_CRYPTO_TRENDS",
        "ASSESS_MARKET_SENTIMENT",
        "REVIEW_CRYPTO_ANNOUNCEMENTS",
        "MONITOR_BLOCKCHAIN_NEWS",
        "STUDY_DEFI_UPDATES",
        "TRACK_CRYPTO_REGULATORY_NEWS",
        "PARSE_CRYPTOCURRENCY_FEEDS",
        "DIGEST_CRYPTO_MARKET_INTELLIGENCE",
        "SCAN_BLOCKCHAIN_HEADLINES",
        "INTERPRET_CRYPTO_MARKET_SIGNALS",
        "PROCESS_DIGITAL_CURRENCY_NEWS",
        "ANALYZE_CRYPTO_MARKET",
    ],
    examples: [
        [
          {
            "user": "{{user1}}",
            "content": {
              "text": "Can you analyze the latest Bitcoin news?"
            }
          },
          {
            "user": "{{user2}}",
            "content": {
              "text": "Analyzing latest Bitcoin market news and sentiment",
              "action": "ANALYZE_CRYPTO_NEWS",
              "content": {
                "params": {
                  "currencies": ["BTC"],
                  "kinds": ["news"],
                  "filter": "hot",
                  "public": true
                }
              }
            }
          }
        ],
        [
          {
            "user": "{{user1}}",
            "content": {
              "text": "Find bullish signals for ETH"
            }
          },
          {
            "user": "{{user2}}",
            "content": {
              "text": "Searching for bullish Ethereum market signals",
              "action": "ANALYZE_CRYPTO_NEWS",
              "content": {
                "params": {
                  "currencies": ["ETH"],
                  "kinds": ["news", "post"],
                  "filter": "bullish",
                  "public": true
                }
              }
            }
          }
        ],
        [
          {
            "user": "{{user1}}",
            "content": {
              "text": "Check market sentiment for SOL"
            }
          },
          {
            "user": "{{user2}}",
            "content": {
              "text": "Analyzing Solana market sentiment across news sources",
              "action": "ANALYZE_CRYPTO_NEWS",
              "content": {
                "params": {
                  "currencies": ["SOL"],
                  "kinds": ["news", "post"],
                  "filter": "rising",
                  "public": true
                }
              }
            }
          }
        ]
      ] as ActionExample[][]
};