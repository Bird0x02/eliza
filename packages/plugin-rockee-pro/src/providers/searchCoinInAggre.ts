import fs from "fs"
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const file = path.join(__dirname, "../src/coin-info-sui.json")
// Load the JSON data
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Function to find items based on verified status and symbol
export async function findByVerifiedAndSymbol( symbol) {
    const matchingItems = data.filter(item => item.symbol.toLowerCase() === symbol.toLowerCase());

    if (matchingItems.length === 0) {
        // No items match the symbol
        return null;
    }
    // Find the first verified item
    const verifiedItem = matchingItems.find(item => item.verified === true);

    // Return the verified item if found, otherwise return the first item
    return verifiedItem || matchingItems[0];
}

export async function findByVerifiedAndName(name) {
    const matchingItems = data.filter(item => item.name.toLowerCase().includes(name.toLowerCase()));

    if (matchingItems.length === 0) {
        // No items match the symbol
        return null;
    }

    // Find the first verified item
    const verifiedItem = matchingItems.find(item => item.verified === true);

    // Return the verified item if found, otherwise return the first item
    return verifiedItem || matchingItems[0];
}

export async function findTypesBySymbols(symbols: string[]){
    return symbols.map(symbol => {
      const token = data.find((t: any) => t.symbol === symbol);
      return token ? token.type : null;
    }).filter(type => type !== null) as string[];
  }

  export async function findTypesBySymbolsv2(symbols){
    return symbols.map(symbol => {
      const token = data.find((t: any) => t.symbol === symbol);
      return token ? { symbol: token.symbol, type: token.type,iconUrl:token.iconUrl }: null;
    }).filter(entry => entry !== null);
  }