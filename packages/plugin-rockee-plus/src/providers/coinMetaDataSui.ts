import { SuiClient} from "@mysten/sui/client"
const suiClient = new SuiClient({
    url: "https://fullnode.mainnet.sui.io", 
  });

export default async function getInfoTokenOnSui(coinType:string){
    try {
        const metadata = await suiClient.getCoinMetadata({ coinType });
        return metadata;
    } catch (error) {
        console.log(error);
        return "ADDRESS_NOT_EXIST"
    }

}