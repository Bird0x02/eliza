// import { elizaLogger, IAgentRuntime, Memory, State } from "@elizaos/core";
import axios, { AxiosInstance } from "axios";

interface NetworkRaw {
  id: string;
  type: string;
  attributes: {
    name: string;
    coingecko_asset_platform_id: string;
  };
}

interface NetworkFlat {
  id: string;
  type: string;
  name: string;
  coingecko_asset_platform_id: string;
}

interface PoolRaw {
  id: string;
  type: string;
  attributes: {
    base_token_price_usd: string;
    base_token_price_native_currency: string;
    quote_token_price_usd: string;
    quote_token_price_native_currency: string;
    base_token_price_quote_token: string;
    quote_token_price_base_token: string;
    address: string;
    name: string;
    pool_created_at: string;
    fdv_usd: string;
    market_cap_usd: string;
    price_change_percentage: {
      m5: string;
      h1: string;
      h6: string;
      h24: string;
    };
    transactions: {
      [key: string]: {
        buys: number;
        sells: number;
        buyers: number;
        sellers: number;
      };
    };
    volume_usd: {
      [key: string]: string;
    };
    reserve_in_usd: string;
  };
  relationships: {
    base_token: {
      data: { id: string; type: string };
    };
    quote_token: {
      data: { id: string; type: string };
    };
    dex: {
      data: { id: string; type: string };
    };
  };
}

interface PoolFlat {
  id: string;
  type: string;
  address: string;
  name: string;
  base_token_price_usd: number;
  quote_token_price_usd: number;
  base_token_price_quote_token: number;
  quote_token_price_base_token: number;
  fdv_usd: number;
  market_cap_usd: number;
  reserve_in_usd: number;
  volume_usd_h24: number;
  transactions_h24: { buys: number; sells: number; buyers: number; sellers: number };
  pool_created_at: string;
  base_token_id: string;
  quote_token_id: string;
  dex_id: string;
}

export class GeckoTerminalProvider {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: "https://api.geckoterminal.com/api/v2",
      timeout: 5000,
    });
  }

  // Fetch all networks in raw format
  private async fetchRawNetworks(): Promise<NetworkRaw[]> {
    try {
      const response = await this.api.get('/networks');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching networks:', error.message);
      return [];
    }
  }

  // Flatten a single network item
  private flattenNetworkItem(network: NetworkRaw): NetworkFlat {
    return {
      id: network.id,
      type: network.type,
      name: network.attributes.name,
      coingecko_asset_platform_id: network.attributes.coingecko_asset_platform_id,
    };
  }

  // Fetch and return all networks in flattened format
  async fetchFlattenedNetworks(): Promise<NetworkFlat[]> {
    const rawNetworks = await this.fetchRawNetworks();
    return rawNetworks.map(this.flattenNetworkItem);
  }

  // Fetch DEX pools for a specific network
  async fetchPoolsByNetwork(networkId: string): Promise<PoolFlat[]> {
    try {
      const response = await this.api.get(`/networks/${networkId}/pools/?include=base_token&page=1`);
      const pools: PoolRaw[] = response.data.data;
      // Flatten and map pools
      return pools.map(this.flattenPool);
    } catch (error) {
      console.error(`Error fetching pools for network ${networkId}:`, error.message);
      return [];
    }
  }

  // Fetch pools for a specific token address
  async fetchPoolsByToken(networkId: string, tokenAddress: string): Promise<PoolFlat[]> {
    const url = `/networks/${networkId}/tokens/${encodeURIComponent(tokenAddress)}/pools`;
    try {
      const response = await this.api.get(url);
      const pools: PoolRaw[] = response.data.data;
      // Flatten and map pools
      return pools.map(this.flattenPool);
    } catch (error) {
      console.error(`Error fetching pools for token ${tokenAddress} on network ${networkId}:`, error.message);
      return [];
    }
  }
  async fetchMultipleTokenOnNetwork(networkId: string = "sui-network", tokenAddresses: string[]) {
    const url = `/networks/${networkId}/tokens/multi/${tokenAddresses.join(",")}`;
    try {
        const response = await this.api.get(url,{params: {include: "top_pools"}});
        const pools = response.data;
        console.log(pools)
        // Flatten and map pools
        return pools;
      } catch (error) {
        console.error(`Error fetching pools for token ${tokenAddresses.join(",")} on network ${networkId}:`, error.message);
        return [];
      }
  }
  // Flatten a single pool object
  private flattenPool(pool: PoolRaw): PoolFlat {
    return {
      id: pool.id,
      type: pool.type,
      address: pool.attributes.address,
      name: pool.attributes.name,
      base_token_price_usd: parseFloat(pool.attributes.base_token_price_usd),
      quote_token_price_usd: parseFloat(pool.attributes.quote_token_price_usd),
      base_token_price_quote_token: parseFloat(pool.attributes.base_token_price_quote_token),
      quote_token_price_base_token: parseFloat(pool.attributes.quote_token_price_base_token),
      fdv_usd: parseFloat(pool.attributes.fdv_usd),
      market_cap_usd: parseFloat(pool.attributes.market_cap_usd),
      reserve_in_usd: parseFloat(pool.attributes.reserve_in_usd),
      volume_usd_h24: parseFloat(pool.attributes.volume_usd.h24),
      transactions_h24: pool.attributes.transactions.h24,
      pool_created_at: pool.attributes.pool_created_at,
      base_token_id: pool.relationships.base_token.data.id.split("_")[1],
      quote_token_id: pool.relationships.quote_token.data.id.split("_")[1],
      dex_id: pool.relationships.dex.data.id,
    };
  }
}

export default GeckoTerminalProvider;