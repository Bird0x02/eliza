// import {
//     // elizaLogger,

//     IAgentRuntime, Memory, State } from "@elizaos/core";
import axios, { AxiosInstance } from "axios";
// import { match } from "../utils/matching";

export class SuiOnChainProvider {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://suiscan.xyz/api/sui-backend/mainnet/api",
      timeout: 5000,
    });
  }
  async fetchCollectionNft(
    page: number = 0,
    size: number = 10,
    sortBy: "VOLUME" | "HOLDER" | "AGE" | "ITEMS" | "NAME" = "VOLUME",
    orderBy: "DESC" | "ASC" = "DESC",
    period: "DAY" | "WEEK" | "MONTH" = "DAY") {
    try {
      const response = await this.axiosInstance.get("/collections", {
        params: {
        page,
          size,
          sortBy,
          orderBy,
          period,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw new Error("Failed to fetch market data");
    }
  }


}

export default SuiOnChainProvider;