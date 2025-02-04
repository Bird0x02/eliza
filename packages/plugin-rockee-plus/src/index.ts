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
import { topNewMemeToken } from './actions/topNewMemeToken';
import { cronTopDexProvider } from './providers/topDex';
import { topNftInfos } from './actions/topNft';
import { topMemeByHolders } from './actions/topMemeCoinByHolders';

const rockeePlusPlugin: Plugin = {
  name: "rockeePlusPlugin",
  description: "Everything about rockee plus",
  actions: [
    // executeSwap,
    // executeSwapByAddress,
    // sendTokenBySymbol,
    // checkTxhashOnSui,
    // projectInfo,
    // topDexInfo,
    // suiTokenPriceBySymbol,
    // suiTokenPriceByAddress,
    topMeme,
    topDefi,
    trendingTokens,
    topNewMemeToken,
    topNftInfos,
    topMemeByHolders
],
  evaluators: [],
  providers: []
};

export default rockeePlusPlugin;
// export {suimarketPlugin as suimarketPlugin };
