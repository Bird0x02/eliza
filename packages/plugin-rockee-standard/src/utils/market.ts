import axios from "axios";

const DEXSCREENER_API_BASE = "https://api.dexscreener.com/latest/dex";

// Define the structure of the token trade data
interface TokenTradeData {
  price: number;
  volume_24h: number;
  price_change_24h: number;
  liquidity: number;
  trade_history: TradeHistory[];
}

interface TradeHistory {
  time: string; // ISO timestamp of the trade
  price: number; // Trade price in USD
  amount: number; // Trade volume in token units
}

// Fetch market pair data from Dexscreener
async function fetchMarketPair(tokenAddress: string): Promise<any> {
  const response = await axios.get(`${DEXSCREENER_API_BASE}/search`, {
    params: { q: tokenAddress },
  });

  if (response.data.pairs?.length > 0) {
    return response.data.pairs[0]; // Take the first match
  }
  throw new Error("Token address not found on Dexscreener.");
}

// Fetch trade history for a specific pair
async function fetchTradeHistory(pairAddress: string): Promise<TradeHistory[]> {
  const response = await axios.get(`${DEXSCREENER_API_BASE}/pair/${pairAddress}`);
  const trades = response.data.trades || [];
  
  return trades.map((trade: any) => ({
    time: trade.time,
    price: parseFloat(trade.priceUsd),
    amount: parseFloat(trade.amount),
  }));
}

// Collect market data for a token
export async function collectMarketData(tokenAddress: string): Promise<TokenTradeData> {
  try {
    const pair = await fetchMarketPair(tokenAddress);

    const tradeHistory = await fetchTradeHistory(pair.pairAddress);

    return {
      price: parseFloat(pair.priceUsd), // Current price in USD
      volume_24h: parseFloat(pair.volume.h24), // 24-hour trading volume
      price_change_24h: parseFloat(pair.priceChange.h24), // 24-hour price change
      liquidity: parseFloat(pair.liquidity.usd), // Liquidity in USD
      trade_history: tradeHistory, // List of recent trades
    };
  } catch (error) {
    console.error(`Error fetching market data for ${tokenAddress}:`, error.message);
    throw error;
  }
}
