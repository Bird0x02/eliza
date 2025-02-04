import axios from "axios";
const BASE_URL = "https://suiscan.xyz/api/sui-backend/mainnet/api";
export async function getTokenOnSuiScan(tokenAddress: string) {
    try {
        const response = await axios.get(`${BASE_URL}/coins/${tokenAddress}`);
 
        return response.data;
    } catch (error) {
        console.log(error);
        return "ADDRESS_NOT_EXIST";
    }
}