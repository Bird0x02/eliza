
import fs from "fs/promises"
import { fileURLToPath } from "url";
import path from "path";
import { elizaLogger } from "@elizaos/core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const stake_pool_info = [
    path.join(__dirname, "../src/data/stake_pools_navi.json"),
];
export const searchPoolInFileJson = async(name:string)=>{
    const results = await Promise.all(
        stake_pool_info.map(async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                const listPools = JSON.parse(data);

                const foundPool = listPools.find(
                    (project: { name: string }) => {
                        return (
                            (project.name && project.name.toLowerCase().includes(name.toLowerCase()) )
                        );
                    }
                );
                return foundPool || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );
    return results.find(result => result !== null) || null;
}
export const listPoolsInFileJson = async()=>{
    const results = await Promise.all(
        stake_pool_info.map(async (file) => {
            try {
                const data = await fs.readFile(file, 'utf8');
                // elizaLogger.info(data)
                const listPools = JSON.parse(data);
                return listPools || null;
            } catch (err) {
                console.error(`Error reading file ${file}:`, err);
                return null;
            }
        })
    );
    return results[0];
}
export const pool: Pool = {
    Sui: {
      name: "SUI",
      assetId: 0,
      poolId:
        "0x96df0fce3c471489f4debaaa762cf960b3d97820bd1f3f025ff8190730e958c5",
      type: "0x2::sui::SUI",
      reserveObjectId:
        "0xab644b5fd11aa11e930d1c7bc903ef609a9feaf9ffe1b23532ad8441854fbfaf",
      borrowBalanceParentId:
        "0xe7ff0daa9d090727210abe6a8b6c0c5cd483f3692a10610386e4dc9c57871ba7",
      supplyBalanceParentId:
        "0x589c83af4b035a3bc64c40d9011397b539b97ea47edf7be8f33d643606bf96f8",
    },
    USDT: {
      name: "USDT",
      assetId: 2,
      poolId:
        "0x0e060c3b5b8de00fb50511b7a45188c8e34b6995c01f69d98ea5a466fe10d103",
      type: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
      reserveObjectId:
        "0xb8c5eab02a0202f638958cc79a69a2d30055565caad1684b3c8bbca3bddcb322",
      borrowBalanceParentId:
        "0xc14d8292a7d69ae31164bafab7ca8a5bfda11f998540fe976a674ed0673e448f",
      supplyBalanceParentId:
        "0x7e2a49ff9d2edd875f82b76a9b21e2a5a098e7130abfd510a203b6ea08ab9257",
    },
    WETH: {
      name: "WETH",
      assetId: 3,
      poolId:
        "0x71b9f6e822c48ce827bceadce82201d6a7559f7b0350ed1daa1dc2ba3ac41b56",
      type: "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
      reserveObjectId:
        "0xafecf4b57899d377cc8c9de75854c68925d9f512d0c47150ca52a0d3a442b735",
      borrowBalanceParentId:
        "0x7568d06a1b6ffc416a36c82791e3daf0e621cf19d4a2724fc6f74842661b6323",
      supplyBalanceParentId:
        "0xa668905b1ad445a3159b4d29b1181c4a62d864861b463dd9106cc0d97ffe8f7f",
    },
    CETUS: {
      name: "CETUS",
      assetId: 4,
      poolId:
        "0x3c376f857ec4247b8ee456c1db19e9c74e0154d4876915e54221b5052d5b1e2e",
      type: "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
      reserveObjectId:
        "0x66a807c06212537fe46aa6719a00e4fa1e85a932d0b53ce7c4b1041983645133",
      borrowBalanceParentId:
        "0x4c3da45ffff6432b4592a39cdb3ce12f4a28034cbcb804bb071facc81fdd923d",
      supplyBalanceParentId:
        "0x6adc72faf2a9a15a583c9fb04f457c6a5f0b456bc9b4832413a131dfd4faddae",
    },
    vSui: {
      name: "VoloSui",
      assetId: 5,
      poolId:
        "0x9790c2c272e15b6bf9b341eb531ef16bcc8ed2b20dfda25d060bf47f5dd88d01",
      type: "0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT",
      reserveObjectId:
        "0xd4fd7e094af9819b06ea3136c13a6ae8da184016b78cf19773ac26d2095793e2",
      borrowBalanceParentId:
        "0x8fa5eccbca2c4ba9aae3b87fd44aa75aa5f5b41ea2d9be4d5321379384974984",
      supplyBalanceParentId:
        "0xe6457d247b6661b1cac123351998f88f3e724ff6e9ea542127b5dcb3176b3841",
    },
    haSui: {
      name: "HaedalSui",
      assetId: 6,
      poolId:
        "0x6fd9cb6ebd76bc80340a9443d72ea0ae282ee20e2fd7544f6ffcd2c070d9557a",
      type: "0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI",
      reserveObjectId:
        "0x0c9f7a6ca561dc566bd75744bcc71a6af1dc3caf7bd32c099cd640bb5f3bb0e3",
      borrowBalanceParentId:
        "0x01f36898e020be6c3423e5c95d9f348868813cd4d0be39b0c8df9d8de4722b00",
      supplyBalanceParentId:
        "0x278b8e3d09c3548c60c51ed2f8eed281876ea58c392f71b7ff650cc9286d095b",
    },
    NAVX: {
      name: "NAVX",
      assetId: 7,
      poolId:
        "0xc0e02e7a245e855dd365422faf76f87d9f5b2148a26d48dda6e8253c3fe9fa60",
      type: "0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX",
      reserveObjectId:
        "0x2e13b2f1f714c0c5fa72264f147ef7632b48ec2501f810c07df3ccb59d6fdc81",
      borrowBalanceParentId:
        "0xa5bf13075aa400cbdd4690a617c5f008e1fae0511dcd4f7121f09817df6c8d8b",
      supplyBalanceParentId:
        "0x59dedca8dc44e8df50b190f8b5fe673098c1273ac6168c0a4addf3613afcdee5",
    },
    WBTC: {
      name: "WBTC",
      assetId: 8,
      poolId:
        "0xd162cbe40f8829ce71c9b3d3bf3a83859689a79fa220b23d70dc0300b777ae6e",
      type: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN",
      reserveObjectId:
        "0x8b4d81f004e4e9faf4540951a896b6d96e42598a270e6375f598b99742db767e",
      borrowBalanceParentId:
        "0x55e1f3c9e6e5cf9fff563bdd61db07a3826458c56ef72c455e049ab3b1b0e99c",
      supplyBalanceParentId:
        "0x821e505a0091b089edba94deaa14c2f2230d026bbaa7b85680554441aad447e0",
    },
    AUSD: {
      name: "AUSD",
      assetId: 9,
      poolId:
        "0xc9208c1e75f990b2c814fa3a45f1bf0e85bb78404cfdb2ae6bb97de58bb30932",
      type: "0x2053d08c1e2bd02791056171aab0fd12bd7cd7efad2ab8f6b9c8902f14df2ff2::ausd::AUSD",
      reserveObjectId:
        "0x918889c6a9d9b93108531d4d59a4ebb9cc4d41689798ffc1d4aed6e1ae816ec0",
      borrowBalanceParentId:
        "0x551300b9441c9a3a16ca1d7972c1dbb4715e15004ccd5f001b2c2eee22fd92c1",
      supplyBalanceParentId:
        "0xe151af690355de8be1c0281fbd0d483c099ea51920a57c4bf8c9666fd36808fd",
    },
    wUSDC: {
      name: "wUSDC",
      assetId: 1,
      poolId:
        "0xa02a98f9c88db51c6f5efaaf2261c81f34dd56d86073387e0ef1805ca22e39c8",
      type: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      reserveObjectId:
        "0xeb3903f7748ace73429bd52a70fff278aac1725d3b58afa781f25ce3450ac203",
      borrowBalanceParentId:
        "0x8a3aaa817a811131c624658f6e77cba04ab5829293d2c49c1a9cce8ac9c8dec4",
      supplyBalanceParentId:
        "0x8d0a4467806458052d577c8cd2be6031e972f2b8f5f77fce98aa12cd85330da9",
    },
    nUSDC: {
      name: "nUSDC",
      assetId: 10,
      poolId:
        "0xa3582097b4c57630046c0c49a88bfc6b202a3ec0a9db5597c31765f7563755a8",
      type: "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
      reserveObjectId:
        "0x4c8a2c72a22ae8da803a8519798d312c86e74a9e0d6ec0eec2bfcf7e4b3fef5e",
      borrowBalanceParentId:
        "0xb0b0c7470e96cabbb4f1e8d06bef2fbea65f4dbac52afae8635d9286b1ea9a09",
      supplyBalanceParentId:
        "0x08b5ce8574ac3bc9327e66ad5decd34d07ee798f724ad01058e8855ac9acb605",
    },
    ETH: {
      name: "ETH",
      assetId: 11,
      poolId:
        "0x78ba01c21d8301be15690d3c30dc9f111871e38cfb0b2dd4b70cc6052fba41bb",
      type: "0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH",
      reserveObjectId:
        "0x376faea6dfbffab9ea808474cb751d91222b6d664f38c0f1d23de442a8edb1ce",
      borrowBalanceParentId:
        "0xf0c6ce5cfaee96073876a5fab7426043f3a798b79502c4caeb6d9772cd35af1f",
      supplyBalanceParentId:
        "0xc0a0cb43620eb8a84d5a4a50a85650e7fa7ba81e660f9cc2863404fd84591d4b",
    },
    USDY: {
      name: "USDY",
      assetId: 12,
      poolId:
        "0x4b6253a9f8cf7f5d31e6d04aed4046b9e325a1681d34e0eff11a8441525d4563",
      type: "0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY",
      reserveObjectId:
        "0xddeb55afe4860995d755fddb0b1dfb8f8011ca08edb66e43c867a21bd6e0551a",
      borrowBalanceParentId:
        "0xc0f59c5665d6289408ba31efc48718daa4d14a291a303a0d50d306e51eb68872",
      supplyBalanceParentId:
        "0x8aac332c01340926066a53f7a5f8ac924e61ea2ae6bc6ce61f112e9094fd5639",
    },
    NS: {
      name: "NS",
      assetId: 13,
      poolId:
        "0x2fcc6245f72795fad50f17c20583f8c6e81426ab69d7d3590420571364d080d4",
      type: "0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS",
      reserveObjectId:
        "0x03f405f4d5ed2688b8b7ab4cfbf3e0a8572622a737d615db829342131f3586f2",
      borrowBalanceParentId:
        "0x2c7b7e6d323ca8f63908bb03191225a2ecf177bf0c4602ccd21d7ac121d52fa4",
      supplyBalanceParentId:
        "0x071dc718b1e579d476d088456979e30d142ecdde6a6eec875477b5b4786530f0",
    },
    LorenzoBTC: {
      name: "stBTC",
      assetId: 14,
      poolId:
        "0xd96dcd6982c45e580c83ff1d96c2b4455a874c284b637daf67c0787f25bc32dd",
      type: "0x5f496ed5d9d045c5b788dc1bb85f54100f2ede11e46f6a232c29daada4c5bdb6::coin::COIN",
      reserveObjectId:
        "0x9634f9f7f8ea7236e2ad5bfbecdce9673c811a34cf8c3741edfbcaf5d9409100",
      borrowBalanceParentId:
        "0xb5cac1b39f67da86f4496f75339001a12f4b8ba78b047682f5158ac4ae8e1649",
      supplyBalanceParentId:
        "0xad0d8be450e020f54e3212b5b1f4f1256bb8ea882bc85bc9f86708f73d653720",
    },
    DEEP: {
      name: "DEEP",
      assetId: 15,
      poolId:
        "0x08373c5efffd07f88eace1c76abe4777489d9ec044fd4cd567f982d9c169e946",
      type: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
      reserveObjectId:
        "0x0b30fe8f42a4fda168c38d734e42a36a77b3d4dd6669069b1cbe53a0c3905ba8",
      borrowBalanceParentId:
        "0xba03bb3e0167e1ec355926dfe0c130866857b062b93fb5d9cfba20824ad9f1d5",
      supplyBalanceParentId:
        "0x3fdd91f32dcea2af6e16ae66a7220f6439530ef6238deafe5a72026b3e7aa5f5",
    },
    FDUSD: {
      name: "FDUSD",
      assetId: 16,
      poolId:
        "0x38d8ac76efc14035bbc8c8b38803f5bd012a0f117d9a0bad2103f8b2c6675b66",
      type: "0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD",
      reserveObjectId:
        "0xf1737d6c6c1fffdf145c440a9fc676de0e6d0ffbacaab5fa002d30653f235a8e",
      borrowBalanceParentId:
        "0x4a4bb401f011c104083f56e3ee154266f1a88cad10b8acc9c993d4da304ebf00",
      supplyBalanceParentId:
        "0x6dffc3d05e79b055749eae1c27e93a47b5a9999214ce8a2f6173574151d120bf",
    },
    BLUE: {
      name: "BLUE",
      assetId: 17,
      poolId:
        "0xe2cfd1807f5b44b44d7cabff5376099e76c5f0e4b35a01bdc4b0ef465a23e32c",
      type: "0xe1b45a0e641b9955a20aa0ad1c1f4ad86aad8afb07296d4085e349a50e90bdca::blue::BLUE",
      reserveObjectId:
        "0xcc993cdfc8fcf421115bb4b2c2247abbfecff35bcab777bb368b4b829d39b073",
      borrowBalanceParentId:
        "0x897b75f0e55b9cfaae65e818d02ebefa5c91d4cf581f9c7c86d6e39749c87020",
      supplyBalanceParentId:
        "0xc12b3d04d566fb418a199a113c09c65c121fd878172084ec0c60e08def51726f",
    },
    BUCK: {
      name: "BUCK",
      assetId: 18,
      poolId:
        "0x98953e1c8af4af0cd8f59a52f9df6e60c9790b8143f556751f10949b40c76c50",
      type: "0xce7ff77a83ea0cb6fd39bd8748e2ec89a3f41e8efdc3f4eb123e0ca37b184db2::buck::BUCK",
      reserveObjectId:
        "0xe1182350b6756e664f824aa1448f5fc741ddc868168dbe09ed3a6e79b7bf249c",
      borrowBalanceParentId:
        "0x6ae3645ff5936c10ab98c2529d3a316b0d4b22eff46d0d262e27db41371af597",
      supplyBalanceParentId:
        "0xdcd4fd6c686eebb54b1816e9851183647a306817303d306bbf70f82757f3eff9",
    },
    suiUSDT: {
      name: "suiUSDT",
      assetId: 19,
      poolId:
        "0xa3e0471746e5d35043801bce247d3b3784cc74329d39f7ed665446ddcf22a9e2",
      type: "0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT",
      reserveObjectId:
        "0x2abb6f2b007fef1e59133b027f53eca568f3af79e310e6f16d4b37bc09664a50",
      borrowBalanceParentId:
        "0x2ad9fe604fb74c1acfe646fe79fc27acf7b62cf4e7d0c6cbb23f6d440ce79306",
      supplyBalanceParentId:
        "0xe0399b39ca6127a879071371aff22ca98d8e7f24872afa8435a12e2a77c00e15",
    },
    stSUI: {
      name: "stSUI",
      assetId: 20,
      poolId:
        "0x0bccd5189d311002f4e10dc98270a3362fb3f7f9d48164cf40828f6c09f351e2",
      type: "0xd1b72982e40348d069bb1ff701e634c117bb5f741f44dff91e472d3b01461e55::stsui::STSUI",
      reserveObjectId:
        "0x9a91a751ff83ef1eb940066a60900d479cbd39c6eaccdd203632c97dedd10ce9",
      borrowBalanceParentId:
        "0x67bbcb4d8ef039883c568fe74016ba85839d14f158d9926d68cf930a4d16b169",
      supplyBalanceParentId:
        "0xfa30b3db35ee961f702f259ea42fb9c5524dce630187e3a7e0b0e24eb0187fef",
    },
    suiBTC: {
      name: "suiBTC",
      assetId: 21,
      poolId:
        "0x348f4049063e6c4c860064d67a170a7b3de033db9d67545d98fa5da3999966bc",
      type: "0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC",
      reserveObjectId:
        "0xb6a8441d447dd5b7cd45ef874728a700cd05366c331f9cc1e37a4665f0929c2b",
      borrowBalanceParentId:
        "0x33d8a4cb800c863f19ae27fc173e1eb5895cdbcea7ae302b756fb275c678dc72",
      supplyBalanceParentId:
        "0xf99e9bbd4c2b5dee460abeddc0f96042f2fb51420cb634d5a378d5d7643dd189",
    },
  };

  export interface Pool {
    Sui: PoolConfig;
    USDT: PoolConfig;
    WETH: PoolConfig;
    CETUS: PoolConfig;
    vSui: PoolConfig;
    haSui: PoolConfig;
    NAVX: PoolConfig;
    WBTC: PoolConfig;
    AUSD: PoolConfig;
    wUSDC: PoolConfig;
    nUSDC: PoolConfig;
    ETH: PoolConfig;
    USDY: PoolConfig;
    NS: PoolConfig;
    LorenzoBTC: PoolConfig;
    DEEP: PoolConfig;
    FDUSD: PoolConfig;
    BLUE: PoolConfig;
    BUCK: PoolConfig;
    suiUSDT: PoolConfig;
    stSUI: PoolConfig;
    suiBTC: PoolConfig;
  }
  export interface PoolConfig {
    name: string; // Customized Names
    assetId: number;
    poolId: string; // Type must be ${PriceOraclePackage}::pool::Pool<${CoinType}>
    type: string; // CoinType
    reserveObjectId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::ReserveData
    borrowBalanceParentId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::TokenBalance
    supplyBalanceParentId: string; // Get it from dynamic object, type must be ${ProtocolPackage}::storage::TokenBalance
  }