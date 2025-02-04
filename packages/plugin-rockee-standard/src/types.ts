export interface CoinData {
    id: string;
    symbol: string;
    name: string;
    market_data: {
      current_price: {
        [currency: string]: number;
      };
    };
  }