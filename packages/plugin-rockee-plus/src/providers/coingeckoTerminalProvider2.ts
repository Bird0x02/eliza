import axios, { AxiosInstance } from 'axios';

// Interfaces for token raw and flat data structures
interface TokenRaw {
  id: string;
  type: string;
  attributes: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image_url: string;
    coingecko_coin_id: string | null;
  };
}

interface TokenFlat {
  id: string;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  image_url: string;
  coingecko_coin_id: string | null;
}

  interface TokenDetailRaw {
    id: string;
    type: string;
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      image_url: string;
      coingecko_coin_id: string | null;
      websites: string[];
      description: string | null;
      gt_score: number;
      discord_url: string | null;
      telegram_handle: string | null;
      twitter_handle: string | null;
      categories: string[];
      gt_category_ids: string[];
    };
  }

  interface TokenDetailFlat {
    id: string;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    image_url: string;
    coingecko_coin_id: string | null;
    websites: string[];
    description: string | null;
    gt_score: number;
    discord_url: string | null;
    telegram_handle: string | null;
    twitter_handle: string | null;
    categories: string[];
    gt_category_ids: string[];
  }

export class GeckoTerminalProvider2 {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "https://api.geckoterminal.com/api/v2",
      timeout: 5000,
    });
  }

  async queryTokens(networkId: string = 'sui-network', page: number = 1 , query: string = null): Promise<TokenFlat[]> {
    let url;
    if(query == null){
      url = `/networks/${networkId}/pools?include=base_token&page=${page}`;
    }
    else {
      url = `/search/pools?query=${query}&network=${networkId}&include=base_token&page=${page}`;
    }

    try {
      const response = await this.api.get(url);

      if (!Array.isArray(response.data.included)) {
        console.error("The 'included' field is missing or invalid in the API response.");
        return [];
      }

      const tokens = response.data.included.map((token: TokenRaw) => ({
        base_token_id: token.id.split("_")[1],
        address: token.attributes.address,
        name: token.attributes.name,
        symbol: token.attributes.symbol,
        decimals: token.attributes.decimals,
        image_url: token.attributes.image_url,
        coingecko_coin_id: token.attributes.coingecko_coin_id,
      }));

      return tokens;
    } catch (error) {
      console.error('Error querying tokens:', error.message);
      return [];
    }
  }

  async getTokenDetails(networkId: string = 'sui-network', tokenId: string = '0x7123ef5ec546c363f270ef770472dfad231eeb86469a2d1fba566d6fd74cb9e1::craft::CRAFT'): Promise<TokenDetailFlat | null> {
    const url = `/networks/${networkId}/tokens/${encodeURIComponent(tokenId)}`;

    try {
      const response = await this.api.get(url);

      // Flatten token detail data
      const tokenDetail: TokenDetailRaw = response.data.data;
      return {
        id: tokenDetail.id,
        address: tokenDetail.attributes.address,
        name: tokenDetail.attributes.name,
        symbol: tokenDetail.attributes.symbol,
        decimals: tokenDetail.attributes.decimals,
        image_url: tokenDetail.attributes.image_url,
        coingecko_coin_id: tokenDetail.attributes.coingecko_coin_id,
        websites: tokenDetail.attributes.websites,
        description: tokenDetail.attributes.description,
        gt_score: tokenDetail.attributes.gt_score,
        discord_url: tokenDetail.attributes.discord_url,
        telegram_handle: tokenDetail.attributes.telegram_handle,
        twitter_handle: tokenDetail.attributes.twitter_handle,
        categories: tokenDetail.attributes.categories,
        gt_category_ids: tokenDetail.attributes.gt_category_ids,
      };
    } catch (error) {
      console.error(`Error fetching token details for ${tokenId}:`, error.message);
      return null;
    }
  }
  async getTokenPrice(networkId: string = 'sui-network', tokenId: string = '0x7123ef5ec546c363f270ef770472dfad231eeb86469a2d1fba566d6fd74cb9e1::craft::CRAFT'): Promise<number | null> {
    const url = `/networks/${networkId}/tokens/${encodeURIComponent(tokenId)}/pools`;

    try {
      const response = await this.api.get(url);

      // Flatten token detail data
      console.log(response.data)
      const tokenDetail = response.data.data[0].attributes;
      return tokenDetail.token_price_usd
    } catch (error) {
      console.error(`Error fetching token details for ${tokenId}:`, error.message);
      return null;
    }



  }
  async trendingTokens(networkId: string = 'sui-network', page: number = 1 , query: string = null): Promise<TokenFlat[]> {
  }

  async trendingPools(networkId: string = 'sui-network', page: number = 1 , query: string = null): Promise<TokenFlat[]> {
  }
}

export default GeckoTerminalProvider2;
