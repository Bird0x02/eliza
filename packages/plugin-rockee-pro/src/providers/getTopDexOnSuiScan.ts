import axios from "axios";
const BASE_URL = "https://suiscan.xyz/api/sui-backend/mainnet/api";
export async function getTopDexOnSuiScan() {
    try {
        const response = await axios.post(`${BASE_URL}/dex?page=0&sortBy=CURRENT_TVL&orderBy=DESC&searchStr=&size=20&period=DAY`,
            {"withTvlOnly":true}
        );

        return response.data.content;
    } catch (error) {
        console.log(error);
        return "ADDRESS_NOT_EXIST";
    }
}