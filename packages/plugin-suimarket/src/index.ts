import { Plugin } from '@elizaos/core';
import { suiTokenPriceByAddress } from './actions/suiTokenPriceByAddress';
import { executeSwap } from './actions/swapBySymbol';
import { executeSwapByAddress } from './actions/swapByAddress';
import { sendTokenBySymbol } from './actions/sendTokenBySymbol';
import { checkTxhashOnSui } from './actions/checkInfoTxHash';
import { projectInfo } from './actions/projectCoinOverview';
import { topDexInfo } from './actions/topDexByNetwork';
import { suiTokenPriceBySymbol } from './actions/suiTokenPriceBySymbol';
import { topMeme } from './actions/topMeMeToken';
import { topDefi } from './actions/topDefiToken';
import { trendingTokens } from './actions/trendingTokens';

const suimarketPlugin: Plugin = {
  name: "suimarketPlugin",
  description: "Everything about Sui blockchain",
  actions: [
    executeSwap,
    executeSwapByAddress,
    sendTokenBySymbol,
    checkTxhashOnSui,
    projectInfo,
    topDexInfo,
    suiTokenPriceBySymbol,
    suiTokenPriceByAddress,
    topMeme,
    topDefi,
    trendingTokens
],
  evaluators: [],
  providers: []
};

export default suimarketPlugin;
export {suimarketPlugin as suimarketPlugin };
