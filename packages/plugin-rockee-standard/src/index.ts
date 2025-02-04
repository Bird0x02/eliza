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

const rockeeStandardPlugin: Plugin = {
  name: "rockeeStandardPlugin",
  description: "Everything about rockee standard",
  actions: [
    executeSwap,
    executeSwapByAddress,
    sendTokenBySymbol,
    checkTxhashOnSui,
    projectInfo,
    topDexInfo,
    suiTokenPriceBySymbol,
    suiTokenPriceByAddress,
],
  evaluators: [],
  providers: []
};

export default rockeeStandardPlugin;
// export {suimarketPlugin as suimarketPlugin };
