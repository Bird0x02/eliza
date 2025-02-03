import {
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    elizaLogger,
    Action,
    ActionExample,
    ModelClass,
    // Media
} from "@elizaos/core";
// import axios from 'axios';
// import { callApi } from "../axios";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";


const newsCyptoPanicTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.
    Example response:
    \`\`\`json
    {
        currencies:null,
        kind: null,
        filter: null,
        size: null
    }
    \`\`\`
    {{recentMessages}}

    Extract ONLY from the current message (ignore any previous context or messages):

    Given the recent messages, extract the following information:
    currencies: Extract cryptocurrency symbols, following these rules:
                Look for common crypto symbols (BTC, ETH, SOL, SUI, etc.)
                Convert all symbols to uppercase
                If multiple currencies found, join them with commas
                Must be wrapped in double quotes
                Recognize variations like "bitcoin"/"btc", "ethereum"/"eth"
                Look for connecting words like "and", "&", "," between symbols
                If no currencies specified, return "BTC,ETH,SUI"

    kind: Content type must be one of:
        all (default if not specified)
        news
        media (must be wrapped in double quotes)
        Recognize variations like "NEWS", "MEDIA"
    filter: Content category must be one of:
            rising
            hot (default if not specified)
            bullish
            bearish
            important
            saved
            lol (must be wrapped in double quotes)
            Recognize variations like "RISING", "HOT", "BULLISH", "BEARISH", "IMPORTANT", "SAVED", "LOL"
    size: Number of news items to return: Must be a positive integer Default is 1 if not specified Maximum value is 100 Minimum value is 1 If mentioned in message, use that number If not mentioned, use default value 1
    VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON
    Respond with a JSON markdown block containing only the extracted values.`;



export  const getNewsCryptoPanic: Action = {
    name: 'ANALYZE_CRYPTO_NEWS_PANIC',
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
            elizaLogger.info("content: ",content);
            // elizaLogger.info("content: ",typeof content);
            const urlCryptoPanic = `${process.env.CRYPTO_PANIC_URL}` || "https://cryptopanic.com/api/free/v1/posts";
            if(!content){
                return true;
            }
            content.auth_token = process.env.CRYPTO_PANIC_API_KEY;
            content.approved=true
            if(content.currencies === null){
                content.currencies = "BTC,ETH,SOL";
            }
            if(content.kind === "all" || content.kind === null){
                delete content.kind;
            }
            if( content.filter === null){
                content.filter = "hot"
            }
            if( content.size === null){
                content.size = 1
            }
            const size = content.size;
            const requestOptions = {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                };
            const queryString = new URLSearchParams(content).toString();
            const responseCryptoPanic = await fetch(`${urlCryptoPanic}?${queryString}`, requestOptions);
                if (!responseCryptoPanic.ok) {
                    elizaLogger.error("API Response:", await responseCryptoPanic.text()); // Debug log
                    throw new Error(
                        `Embedding API Error: ${responseCryptoPanic.status} ${responseCryptoPanic.statusText}`
                    );
                }
            const dataCryptoPanic:any = await responseCryptoPanic.json()
            const dataOriginUrl = dataCryptoPanic.results.map((item:any) => item.source.url);
            const promisesOriginUrl = dataOriginUrl.map(async (url) => {
                const response = await fetch(url, requestOptions);
                return await response.url;
              });
            const resultsOriginUrl = await Promise.all(promisesOriginUrl);
            const dataResponse = dataCryptoPanic.results.map((item:any, index) => {
                return {
                    title: item.title,
                    url: resultsOriginUrl[index]
                }
            });
            let responseMessage = "Stay updated! Here are today’s highlights:";
            callback({
                text: responseMessage,
                result:{
                    type: "news",
                    data: dataResponse.slice(0,size)
                }
              })
            // elizaLogger.info("[coingecko] Handle with message ...DONE!");
            return true;
        }
        catch(error){
            elizaLogger.error("[analyzeCryptoNewsPanic] %s", error);
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    //   elizaLogger.info("[news] Validating ...");
    //   elizaLogger.info("[news] Validating ...DONE");
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
        "ANALYZE_BEARISH",
        "ANALYZE_BULLISH",
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



