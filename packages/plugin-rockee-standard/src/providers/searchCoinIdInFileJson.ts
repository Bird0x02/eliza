
import fs from "fs/promises"
import { fileURLToPath } from "url";
import path from "path";

// Chuyển đổi import.meta.url sang __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const files = [
    path.join(__dirname, "../src/coin_list/coin_list.json"),

];

export const searchCoinInFileJsonProvider = async(coinSymbol:string)=>{
    const results = await Promise.all(
        files.map(async (file) => {
            try {

                const data = await fs.readFile(file, 'utf8');
                const coins = JSON.parse(data);

                const foundCoin = coins.find(
                    coin =>
                        coin.symbol.toLowerCase() === coinSymbol.toLowerCase()
                );

                return foundCoin || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );


    return results.find(result => result !== null) || null;
}
// Module exports
export const searchCoinInFileJsonProvider2 = async(coinSymbol:string, coinName:string)=>{
    const results = await Promise.all(
        files.map(async (file) => {
            try {

                const data = await fs.readFile(file, 'utf8');
                const coins = JSON.parse(data);


                const foundCoin = coins.find(
                    coin =>
                        (coin.symbol.toLowerCase() === coinSymbol.toLowerCase()||
                    coin.name.toLowerCase() === coinName.toLowerCase()) &&
                    coin.verified === true
                );

                return foundCoin || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );

    return results.find(result => result !== null) || null;
}
