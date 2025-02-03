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
import { fetchTopDexByNetwork } from "../providers/topDex";
import { hashUserMsg } from "../utils/format";
import { getTopDexOnSuiScan } from "../providers/getTopDexOnSuiScan";
import {RedisClient} from "@elizaos/adapter-redis"
import getActionHint from "../utils/action_hint";
export interface InfoContent extends Content {
    coin_symbol: string;
    coin_name: string;
}

// Network blockchain (e.g. sui-network, ethereum, binance-smart-chain, solana, etc.)

const topDexTemplate = `"Please extract the following swap details for SUI network:
{
    "network_blockchain": string | null,      //Network blockchain (e.g. sui-network, ethereum, binance-smart-chain, solana, etc.)
    "network_blockchain_name": string | null,      //Name Network blockchain (e.g. sui network, ethereum, binance-smart-chain, solana, etc.)
}
Recent messages: {{recentMessages}}
\`\`\`
VALIDATION RULES:
            All property names must use double quotes
            All string values must use double quotes
            null values should not use quotes
            No trailing commas allowed
            No single quotes anywhere in the JSON`;



export const topDexInfo: Action = {
    name: "SHOW_TOP_DECENTRALIZED_EXCHANGES",
    description: "Get top dex by network.",
    similes: [
       "FIND_TOP_DEX",
        "SHOW_TOP_DEX",
        "GET_TOP_DEX",
        "TOP_DEX_BY_NETWORK",
    ],

    examples: [],

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        return true;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("[tokenInfo]");
        const redis = new RedisClient(process.env.REDIS_URL)
        if (!state) {
            state = (await runtime.composeState(message)) as State;
        } else {
            state = await runtime.updateRecentMessageState(state);
        }

        const _context = composeContext({
            state,
            template: topDexTemplate,
        });
        const msgHash = hashUserMsg(message, "top_dex");
        let content:any = await runtime.cacheManager.get(msgHash);

        if(!content){
           const swapContext = composeContext({
               state,
               template: _context,
           })
           content = await generateObjectDeprecated({
               runtime,
               context: swapContext,
               modelClass: ModelClass.SMALL,
           })
           await runtime.cacheManager.set(msgHash, content, {expires: Date.now() + 300000});
        }
        console.log("content",content);
        const topDexOnSuiScan = await getTopDexOnSuiScan()
        let topDexOnCoinGecko:any = await redis.getValue({ key: "TOP_DEX" });
        console.log(topDexOnCoinGecko)
        if (topDexOnCoinGecko) {
            topDexOnCoinGecko = JSON.parse(topDexOnCoinGecko);
        } else {
            topDexOnCoinGecko = await fetchTopDexByNetwork(content.network_blockchain);
        }

        const responseData = topDexOnCoinGecko.data.map(dex => {
            const dexMetricId = dex.relationships.dex_metric.data.id;
            const metric = topDexOnCoinGecko.included.find(item => item.id === dexMetricId);
            const project = topDexOnSuiScan.find(item =>
                dex.attributes.name.toLowerCase().includes(item.projectName.toLowerCase().trim())
            );
            if (!project) return null;
            return {
                swap_volume_usd_24h: metric?.attributes.swap_volume_usd_24h || null,
                swap_count_24h: metric?.attributes.swap_count_24h || null,
                swap_volume_usd_48h_24h: metric?.attributes.swap_volume_usd_48h_24h || null,
                swap_volume_percent_change_24h: metric?.attributes.swap_volume_percent_change_24h || null,
                name: dex.attributes.name,
                identifier: dex.attributes.identifier,
                url: dex.attributes.url,
                // analytics_pool_page_url: dex.attributes.analytics_pool_page_url,
                // analytics_token_page_url: dex.attributes.analytics_token_page_url,
                img_icon: dex.attributes.image_url,
                website: project?.website || null,
                discord: project?.discord || null,
                twitter: project?.twitter || null,
                telegram: project?.telegram || null,
                currentTvl: project?.currentTvl || null,
                volume: project?.volume || null,
                volumeChange: project?.volumeChange || null,
                txBlocks: project?.txBlocks || null,
                // pools: project?.pools || null,
                // packages: project?.packages || []
            };
        });

        // console.log(mappedData);
        callback({
                    text: `The top DEX on ${content.network_blockchain}`,
                    action:"TOP_DEX",
                        result: {
                        type: "top_dex",
                        data:responseData,
                    },
                    action_hint:getActionHint(content.actionHintText)
                });


        return true;
    }
}

