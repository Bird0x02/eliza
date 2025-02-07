import { Plugin } from '@elizaos/core';
import { topMeme } from './actions/topMeMeToken';
import { topDefi } from './actions/topDefiToken';
import { trendingTokens } from './actions/trendingTokens';
import { topNewMemeToken } from './actions/topNewMemeToken';
import { topNftInfos } from './actions/topNft';
import { stakePoolsNavi } from './actions/stakePools';
import { stakeTokenPoolsNavi } from './actions/stakeToken';

const rockeePlusPlugin: Plugin = {
  name: "rockeePlusPlugin",
  description: "Everything about rockee plus",
  actions: [
    topMeme,
    topDefi,
    trendingTokens,
    topNewMemeToken,
    topNftInfos,
    stakePoolsNavi,
    stakeTokenPoolsNavi
],
  evaluators: [],
  providers: []
};

export default rockeePlusPlugin;
// export {suimarketPlugin as suimarketPlugin };
