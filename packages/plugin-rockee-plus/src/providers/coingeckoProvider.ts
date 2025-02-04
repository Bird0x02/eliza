import {
    // elizaLogger,

    IAgentRuntime, Memory, State } from "@elizaos/core";
import axios, { AxiosInstance } from "axios";
// import { match } from "../utils/matching";

export class CoingeckoProvider {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://api.coingecko.com/api/v3",
      timeout: 5000,
    });
  }

  async fetchMarketData(currency: string = "usd", limit: number = 10) {
    try {
      const response = await this.axiosInstance.get("/coins/markets", {
        params: {
          vs_currency: currency,
          order: "market_cap_desc",
          per_page: limit,
          page: 1,
          sparkline: false,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw new Error("Failed to fetch market data");
    }
  }

  async getTrendingCoins() {
    try {
      const response = await this.axiosInstance.get("/search/trending");
      return response.data.coins.map((coin: any) => ({
          id: coin.item.id,
          name: coin.item.name,
          symbol: coin.item.symbol.toUpperCase(),
          market_cap_rank: coin.item.market_cap_rank,
          price: coin.item.data.price,
          total_volume: coin.item.data.total_volume,
          market_cap: coin.item.data.market_cap,
      }));
    } catch (error) {
      console.error("Error fetching trending tokens:", error);
      throw new Error("Failed to fetch trending tokens");
    }
  }

  async getToken(coinId: string) {
    try {
      const response = await this.axiosInstance.get(`/simple/price`, {
        params: {
          ids: coinId,
          vs_currencies: 'usd',
          include_market_cap: true,
          include_24hr_vol: true,
          include_24hr_change: true,
          include_last_updated_at: true,
        },
      });

      return response.data[coinId]; // Return data for the specific coin
    } catch (error) {
      console.error(`Error fetching details for coin ${coinId}:`, error);
      throw new Error("Failed to fetch coin details");
    }
  }

  async getTrendingNFTs() {
    try {
      const response = await this.axiosInstance.get("/search/trending");
      return response.data.nfts.map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        symbol: nft.symbol.toUpperCase(),
        // market_cap_rank: nft.item.market_cap_rank,
        // price: nft.item.data.price,
        // total_volume: nft.item.data.total_volume,
        // market_cap: nft.item.data.market_cap,
        thumb: nft.thumb,
        native_currency_symbol:nft.native_currency_symbol,
        floor_price_in_native_currency:nft.floor_price_in_native_currency,
        floor_price_24h_percentage_change: nft.floor_price_24h_percentage_change,
        data:{
            floor_price:nft.data.floor_price,
            floor_price_in_usd_24h_percentage_change:nft.data.floor_price_in_usd_24h_percentage_change,
            h24_volume:nft.data.h24_volume,

        }

    }));
    } catch (error) {
      console.error("Error fetching trending NFTs:", error);
      throw new Error("Failed to fetch trending NFTs");
    }
  }

  async getNFTDetails(nftId: string) {
    try {
      const response = await this.axiosInstance.get(`/nfts/${nftId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching details for NFT ${nftId}:`, error);
      throw new Error("Failed to fetch NFT details");
    }
  }

  async getTrendingCategories(limit: number = 5) {
    try {
      const response = await this.axiosInstance.get("/coins/categories");
      return response.data.slice(0, limit);
    } catch (error) {
      console.error("Error fetching trending categories:", error);
      throw new Error("Failed to fetch trending categories");
    }
  }

  //@fixme
  async getTrendingMemeCoinsOnSui(limit: number = 10) {
    try {
      const categoriesResponse = await this.axiosInstance.get(`/coins/categories`);
      const memeCategory = categoriesResponse.data.find(
        (category: any) => category.name.toLowerCase() === "meme"
      );

      if (!memeCategory) {
        throw new Error("Meme category not found");
      }

      const coinsResponse = await this.axiosInstance.get(`/coins/markets`, {
        params: {
          vs_currency: "usd",
          category: "meme",
          order: "market_cap_desc",
          per_page: 100,
          page: 1,
        },
      });

      const suiMemeCoins = coinsResponse.data.filter(
        (coin: any) => coin.asset_platform_id === "sui"
      );

      return suiMemeCoins.slice(0, limit);
    } catch (error) {
      console.error("Error fetching trending meme coins on Sui:", error);
      throw new Error("Failed to fetch trending meme coins on Sui network");
    }
  }

  async getTopMarketInfo(
    currency: string = "usd",
    ids: string = "bitcoin,ethereum,solana,bnb,cardano,sui",
    category: string = "layer-1",
    order: string = "market_cap_desc",
    per_page: number = 10,
    page: number = 1,
    price_change_percentage: string = "1h",
    locale: string = "en",
    precision: string = "8"

) {
    try {
      const response = await this.axiosInstance.get("/coins/markets", {
        params: {
          vs_currency: currency,
          order: order,
          per_page: per_page,
          page: page,
          sparkline: false,
          ids,
          category,
          price_change_percentage,
          locale,
          precision
        },
      });

      return response.data.map((coin: any) => ({
          name: coin.name,
          symbol: coin.symbol.toUpperCase(),
          current_price: coin.current_price,
          market_cap: coin.market_cap,
          price_change_percentage_24h: coin.price_change_percentage_24h,
      }));
    } catch (error) {
      console.error("Error fetching top market info:", error);
      throw new Error("Failed to fetch top market info");
    }
  }
  async topSuiTokens( limit: number = 15) {
    try {
        const marketsResponse = await this.axiosInstance.get("/coins/markets", {
          params: {
            vs_currency: "usd",
            category: 'sui-ecosystem',
            order: "market_cap_desc",
            per_page: limit,
            page: 1,
          },
        });

        return marketsResponse.data.map((token: any) => ({
            name: token.name,
            symbol: token.symbol.toUpperCase(),
            price: token.current_price,
            market_cap: token.market_cap,
            price_change_24h: token.price_change_percentage_24h,
        }));

    } catch (error) {
      console.error("Error fetching AI tokens:", error);
      throw new Error("Failed to fetch AI tokens");
    }
  }
  async topNewMeMeCoin( limit: number = 15) {
    try {
        const marketsResponse = await this.axiosInstance.get("/coins/markets", {
          params: {
            vs_currency: "usd",
            category: 'sui-meme',
            order: "market_cap_asc",
            per_page: limit,
            page: 1,
          },
        });

        return marketsResponse.data.map((token: any) => ({
            name: token.name,
            symbol: token.symbol.toUpperCase(),
            price: token.current_price,
            market_cap: token.market_cap,
            price_change_24h: token.price_change_percentage_24h,
        }));

    } catch (error) {
      console.error("Error fetching AI tokens:", error);
      throw new Error("Failed to fetch AI tokens");
    }
  }
  //@fixme exactly evaluate content to decide AI tokens
  async topAiTokens(runtime: IAgentRuntime, message: Memory, state: State, currency: string = "usd", limit: number = 10) {
    try {
        const categoriesResponse = await this.axiosInstance.get("/coins/categories");
        const aiCategory = categoriesResponse.data.find((category: any) =>
           category.name.toLowerCase().includes(" ai ")
        );

        if (!aiCategory) {
          throw new Error("AI category not found");
        }

        const marketsResponse = await this.axiosInstance.get("/coins/markets", {
          params: {
            vs_currency: currency,
            category: aiCategory.id,
            order: "market_cap_desc",
            per_page: limit,
            page: 1,
          },
        });

        return marketsResponse.data.map((token: any) => ({
            name: token.name,
            symbol: token.symbol.toUpperCase(),
            price: token.current_price,
            market_cap: token.market_cap,
            price_change_24h: token.price_change_percentage_24h,
        }));

    } catch (error) {
      console.error("Error fetching AI tokens:", error);
      throw new Error("Failed to fetch AI tokens");
    }
  }

  //@fixme exactly evaluate content to decide AI tokens
  async topMemeTokens(runtime: IAgentRuntime, message: Memory, state: State, currency: string = "usd", limit: number = 10) {
    try {
        const categoriesResponse = await this.axiosInstance.get("/coins/categories");

        //@fixme
        const aiCategory = categoriesResponse.data.find((category: any) =>
          true
            // category.name.toLowerCase().includes(" meme ")
        );

        if (!aiCategory) {
          throw new Error("AI category not found");
        }

        const marketsResponse = await this.axiosInstance.get("/coins/markets", {
          params: {
            vs_currency: currency,
            category: aiCategory.id,
            order: "market_cap_desc",
            per_page: limit,
            page: 1,
          },
        });

        return marketsResponse.data.filter(
          (coin: any) => coin.asset_platform_id === "sui"
        ).
        map((token: any) => ({
            name: token.name,
            symbol: token.symbol.toUpperCase(),
            price: token.current_price,
            market_cap: token.market_cap,
            price_change_24h: token.price_change_percentage_24h,
        }));
    } catch (error) {
      console.error("Error fetching AI tokens:", error);
      throw new Error("Failed to fetch AI tokens");
    }
  }

  async getCoinDataById(coinId: string) {

    try {
    console.log(`https://api.coingecko.com/api/v3/coins/${coinId}`)
      const response = await this.axiosInstance.get(`/coins/${coinId}`);

      return response.data;
    } catch (error) {
      console.error(`Error fetching coin data for ${coinId}:`, error);
      throw new Error("Failed to fetch coin data");
    }
  }
}

export default CoingeckoProvider;