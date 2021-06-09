import { request } from 'graphql-request';
import axios from 'axios';
import { sub, getUnixTime, fromUnixTime, formatISO, parseISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import { BigNumber, ethers, utils, constants, providers } from 'ethers';
import {
  UNISWAP_ENDPOINT,
  SUSHISWAP_ENDPOINT,
  UNISWAP_MARKET_DATA_QUERY,
  UNISWAP_DAILY_PRICE_QUERY,
  getReferencePriceHistory,
  getDateString,
  getCollateralData,
  roundDecimals,
} from '@/utils';
import { ISynth, IToken, ILiquidityPool, AssetGroupModel, AssetModel, DevMiningCalculatorParams } from '@/types';

/// @dev Imports for APR calculation
import moment from 'moment';
import { AbiItem } from 'web3-utils';
import Assets from '../assets/assets.json';
import UNIContract from '../../abi/uni.json';
import EMPContract from '../../abi/emp.json';
import erc20 from '../../abi/erc20.json';
import Web3 from 'web3';
import { ExternalProvider, Web3Provider } from '@ethersproject/providers';

let currentTime = new Date();
const cached = sessionStorage.getItem("timestamp");

if (cached) {
  currentTime.setHours(currentTime.getHours() - 12);
  const expiry = Math.floor(currentTime.getTime() / 1000);

  if (expiry > Number(cached)) {
    sessionStorage.clear();
  }
} else {
  sessionStorage.setItem("timestamp", Math.floor(Date.now() / 1000).toString());
}

const WETH = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
const YAM = '0x0AaCfbeC6a24756c20D41914F2caba817C0d8521';
const UMA = '0x04fa0d235c4abf4bcf4787af4cf447de572ef828';

// Get USD price of token and cache to sessionstorage
/*
export const getUsdPrice = async (tokenAddress: string) => {
  const cached = sessionStorage.getItem(tokenAddress);
  if (cached) return Promise.resolve(Number(cached));

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
    const price = Number(res.data[tokenAddress].usd);
    sessionStorage.setItem(tokenAddress, price.toString());
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};
*/

export const getReferenceSpotPrice = async (synth: ISynth) => {
  switch (synth.group) {
    case 'uGas': {
      const res = await axios.get('https://data.yam.finance/median');
      console.log(res.data);
      return;
    }
    case 'uStonks': {
      const res = await axios.get('https://data.yam.finance/ustonks/index/jun21');
      console.log(res.data);
      return;
    }
    case 'uPUNKS': {
      const res = await axios.get('https://api.yam.finance/degenerative/upunks/price');
      console.log(res.data);
      return;
    }
  }
};

// Get price of token in terms of Ether from Coingecko
// TODO should probably replace with on-chain data
export const getPairPriceEth = async (token: IToken) => {
  const token1Address = token.address;

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${token1Address}&vs_currencies=eth`
    );
    const price = Number(res.data[token1Address]['eth']);
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get USD price from Coingecko
export const getUsdPrice = async (cgId: string) => {
  const cached = sessionStorage.getItem(cgId);
  if (cached) return Promise.resolve(Number(cached));

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`);
    const price = Number(res.data[cgId].usd);
    sessionStorage.setItem(cgId, price.toString());
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get USD price history of token from Coingecko
export const getUsdPriceHistory = async (tokenName: string, chainId: number) => {
  const collateral = getCollateralData(chainId);
  const cgId = collateral[tokenName].coingeckoId;

  try {
    const res = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cgId}/market_chart?vs_currency=usd&days=30&interval=daily`
    );
    const prices = res.data.prices;
    const priceHistory = prices.map(([timestamp, price]: number[]) => {
      const newTimestamp = timestamp.toString().substring(0, timestamp.toString().length - 3);
      const date = getDateString(fromUnixTime(Number(newTimestamp)));
      return [date, price];
    });

    return Promise.resolve(priceHistory);
  } catch (err) {
    return Promise.reject(err);
  }
};

// Get Uniswap pool data
export const getPoolData = async (pool: ILiquidityPool) => {
  const endpoint = pool.location === 'uni' ? UNISWAP_ENDPOINT : SUSHISWAP_ENDPOINT;
  try {
    const data = await request(endpoint, UNISWAP_MARKET_DATA_QUERY, { poolAddress: pool.address });
    return data.pair;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
};

// TODO APRs from API are wrong. Hardcoding for now.
export const getApr = async (group: string, cycle: string): Promise<number> => {
  try {
    const res = await axios.get('https://api.yam.finance/apr/degenerative');
    return Promise.resolve(res.data[group.toUpperCase()][cycle.toUpperCase()]);
  } catch (err) {
    console.error(err);
    return Promise.reject('Failed to get APR.');
  }
};

interface PriceHistoryResponse {
  date: number;
  id: string;
  priceUSD: string;
}

/** Get labels, reference price data and all market price data for this synth type.
 *  Only fetches data from mainnet. This is intentional.
 */
// TODO this will grab data for individual synth
// TODO data will NOT be paired to USD
/*
export const getDailyPriceHistory_new = async (synth: ISynth) => {
  const synthAddress = synth.token.address;
  const poolAddress = synth.pool.address;

  // Defaults to 30 days
  const min = sub(new Date(), { days: 30 });
  const max = new Date();
  const startingTime = getUnixTime(min);

  const dateArray = (() => {
    const dates: string[] = [];
    const currentDate = new Date(min);
    while (currentDate <= max) {
      dates.push(getDateString(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  })();

  // Get reference index prices for each date
  const referencePrices = await (async () => {
    const refPrices = await getReferencePriceHistory(synth.group, 1); // TODO

    // If API gives too much data, filter to find relevant data.
    if (refPrices > 30) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      return refPrices.slice(minIndex);
    } else {
      return refPrices;
    }
  })();

  console.log(referencePrices);

  // Get pool data from subgraph
  const poolData: { pairDayDatas: PriceHistoryResponse[] } = await request(
    UNISWAP_ENDPOINT[1],
    UNISWAP_DAILY_PAIR_DATA,
    {
      pairAddress: poolAddress,
      startingTime: startingTime,
    }
  );

  const dailyPriceResponse: {
    tokenDayDatas: PriceHistoryResponse[];
  } = await request(UNISWAP_ENDPOINT, UNISWAP_DAILY_PRICE_QUERY, {
    tokenAddresses: addressList,
    startingTime: startingTime,
  });

  console.log(poolData);

  // Find which token is the synth
  const tokenId = poolData.pairDayDatas[0].token0.id === synthAddress ? 'token0' : 'token1';

  // Put pool price data into a map, indexed by date
  const dailyPairData = new Map(
    poolData.pairDayDatas.map((dailyData) => [
      formatISO(fromUnixTime(dailyData.date), { representation: 'date' }),
      dailyData[tokenId].derivedETH,
    ])
  );
  //console.log(dailyPairData);

  // Fill in empty spaces, since subgraph only captures price when it changes
  let lastPrice = dailyPairData.values().next().value;

  const synthPrices = dateArray.map((date) => {
    const price = dailyPairData.get(date);
    if (price) {
      lastPrice = price;
      return roundDecimals(Number(price), 2);
    } else {
      return roundDecimals(Number(lastPrice), 2);
    }
  });

  //console.log(synthPrices);

  return {
    labels: dateArray,
    referencePrices: referencePrices,
    synthPrices: synthPrices,
  };
};
*/

// TODO This whole function needs to be refactored
/** Get labels, reference price data and all market price data for this synth type. */
export const getDailyPriceHistory = async (group: string, synthMetadata: Record<string, ISynth>, chainId: number) => {
  // Defaults to 30 days
  const startingTime = getUnixTime(sub(new Date(), { days: 30 }));

  const relevantSynths = new Map(
    Object.entries(synthMetadata)
      .filter(([name, synth]) => synth.group === group)
      .map(([name, synth]) => [synth.token.address, name])
  );

  const addressList = Array.from(relevantSynths.keys());

  // TODO Consider grabbing paired data, not USD
  const dailyPriceResponse: {
    tokenDayDatas: PriceHistoryResponse[];
  } = await request(UNISWAP_ENDPOINT, UNISWAP_DAILY_PRICE_QUERY, {
    tokenAddresses: addressList,
    startingTime: startingTime,
  });

  // Use reduce to find min and max range dates
  const [min, max] = dailyPriceResponse.tokenDayDatas
    .map((data) => fromUnixTime(data.date))
    .reduce((acc: Date[], val: Date) => {
      acc[0] = acc[0] === undefined || val < acc[0] ? val : acc[0];
      acc[1] = acc[1] === undefined || val > acc[1] ? val : acc[1];
      return acc;
    }, []);

  // Generate array of dates from min to max, convert to ISO string
  const dateArray = (() => {
    if (min && max) {
      const dates: string[] = [];
      const currentDate = new Date(min);
      while (currentDate <= max) {
        dates.push(getDateString(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    } else {
      return [];
    }
  })();

  // Get reference index prices (USD) for each date
  const referenceData = await (async () => {
    const refPrices = await getReferencePriceHistory(group, chainId);

    if (refPrices.length > 30) {
      const minIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(min));
      const maxIndex = refPrices.findIndex((ref: any) => getDateString(parseISO(ref.timestamp)) === getDateString(max));
      return refPrices.slice(minIndex, maxIndex).map((ref: any) => ref.price);
    } else {
      const returnObject: any[] = [];
      const refMap = new Map(
        refPrices.map(({ timestamp, price }: { timestamp: string; price: number }) => [timestamp, price])
      );

      console.log(refMap.get(dateArray[10]));
      dateArray.forEach((date) => {
        console.log(date);
        refMap.get(date) ? returnObject.push(refMap.get(date)) : returnObject.push(undefined);
      });

      return returnObject;
    }
  })();

  //console.log(referenceData);

  // Map price data to date for each synth for easy access
  const priceData: Record<string, Record<string, number>> = {};

  dailyPriceResponse.tokenDayDatas.forEach((dayData) => {
    // id is concatenated with a timestamp at end. Not necessary for us since we have the date
    const synthName = relevantSynths.get(dayData.id.split('-')[0]) ?? '';

    if (!priceData[synthName]) priceData[synthName] = {};
    const date = formatISO(fromUnixTime(dayData.date), { representation: 'date' });
    priceData[synthName][date] = Math.round(Number(dayData.priceUSD) * 100) / 100;
  });

  // Create object of arrays for reference prices and all synth prices
  const res: Record<string, number[]> = { Reference: referenceData };
  dateArray.forEach((date) => {
    Object.keys(priceData).forEach((synthName) => {
      if (!res[synthName]) res[synthName] = [];

      if (priceData[synthName][date]) {
        res[synthName].push(priceData[synthName][date]);
      } else {
        // If no price for date, copy last pushed price
        const prevIndex = res[synthName].length - 1;
        res[synthName].push(res[synthName][prevIndex]);
      }
    });
  });

  console.log(res);

  return {
    labels: dateArray,
    synthPrices: res,
  };
};

/**** APR CALCULATION ****/

/**
 * Fetch the mining rewards
 * @param {string} assetName Name of an asset for the input
 * @param {AssetModel} asset Asset object for the input
 * @param {number} assetPrice Asset price for the input
 * @param {number} cr Collateral Ratio for the input
 * @param {number} tokenCount Total supply for the input
 * @public
 * @methods
 */
export const getMiningRewards = async (
  assetName: string,
  asset: ISynth,
  assetPrice: number,
  cr: number,
  tokenCount: number,
) => {
  // TODO Use params for setup instead of test setup
  const rpcURL = 'https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud';
  const ethersProvider: ethers.providers.JsonRpcProvider = new ethers.providers.JsonRpcProvider(rpcURL || '');
  const network = 'mainnet';

  /// @dev Check if params are set
  if (!assetName || !asset || !assetPrice || !cr || !tokenCount) {
    return 0;
  }

  const cached = sessionStorage.getItem(assetName);
  if (cached) return cached;

  try {
    const contractLp = new ethers.Contract(asset.pool.address, UNIContract.abi, ethersProvider);

    const [
        jsonEmpData,
        contractLpCall,
        ethPrice,
        umaPrice,
        yamPrice
    ] = await Promise.all([
        getEmpData(ethersProvider, network),
        contractLp.getReserves(),
        getPriceByContract(WETH),
        getPriceByContract(UMA),
        getPriceByContract(YAM),
    ]);

    const jsonEmpObject = JSON.parse(jsonEmpData)
    const { rewards, whitelistedTVM } = jsonEmpObject

    /// @dev Setup base variables for calculation
    let baseCollateral;
    const baseAsset = BigNumber.from(10).pow(asset.token.decimals);

    /// @dev Temporary pricing
    let tokenPrice;
    if (asset.collateral === "USDC") {
      baseCollateral = BigNumber.from(10).pow(6);
      /* @ts-ignore */
      tokenPrice = assetPrice * 1;
      // } else if(assetInstance.collateral === "YAM"){
      //   tokenPrice = assetPrice * yamPrice;
    } else {
      baseCollateral = BigNumber.from(10).pow(18);
      /* @ts-ignore */
      // tokenPrice = assetPrice * ethPrice;
      tokenPrice = assetPrice * 1;
    }

    /// @dev Prepare reward calculation
    const current = moment().unix();
    /// @TODO Update week1UntilWeek2 and week3UntilWeek4 timestamps for uPUNKS after launch.
    const week1UntilWeek2 = 1615665600;
    const week3UntilWeek4 = 1616961600;
    const umaRewards = rewards[asset.emp.address];
    let yamWeekRewards = 0;
    let umaWeekRewards = 0;
    /// @TODO Check assetName
    if (assetName === "uPUNKS-SEP09") {
      if (current < week1UntilWeek2) {
        umaWeekRewards += 5000
      } else if (current < week3UntilWeek4) {
        yamWeekRewards += 5000;
      }
    }

    /// @dev Calculate rewards
    let calcAsset = 0;
    let calcCollateral = 0;
    const additionalWeekRewards = umaWeekRewards * umaPrice + yamWeekRewards * yamPrice;
    const assetReserve0 = BigNumber.from(contractLpCall._reserve0).div(baseAsset).toNumber();
    const assetReserve1 = BigNumber.from(contractLpCall._reserve1).div(baseCollateral).toNumber();

    if (assetName.includes("uSTONKS")) {
      calcAsset = assetReserve1 * tokenPrice;
      calcCollateral = assetReserve0 * (asset.collateral == "WETH" ? ethPrice : 1);
    } else {
      calcAsset = assetReserve0 * tokenPrice;
      calcCollateral = assetReserve1 * (asset.collateral == "WETH" ? ethPrice : 1);
    }

    /// @dev Prepare calculation
    console.log("assetName", assetName)
    // getEmpInfo.tokenCount
    const _tokenCount: number = tokenCount
    console.log("_tokenCount", _tokenCount.toString())
    // getEmpInfo.tokenPrice
    const _tokenPrice: number = tokenPrice
    console.log("_tokenPrice", _tokenPrice)
    // whitelistedTVM
    const _whitelistedTVM: number = Number(whitelistedTVM)
    console.log("_whitelistedTVM", _whitelistedTVM)
    // 50_000
    /// @TODO Check why umaRewards != 50_000
    const _umaRewards: number = 50_000
    console.log("_umaRewards", _umaRewards)
    // umaPrice
    const _umaPrice: number = umaPrice
    console.log("_umaPrice", _umaPrice)
    // 0.82
    const _developerRewardsPercentage: number = 0.82
    console.log("_developerRewardsPercentage", _developerRewardsPercentage)
    // additionalWeekRewards
    const _additionalWeekRewards: number = additionalWeekRewards
    console.log("_additionalWeekRewards", _additionalWeekRewards)
    // calcAsset
    const _calcAsset: number = calcAsset
    console.log("_calcAsset", _calcAsset)
    // 1
    const _one: number = 1
    console.log("_one", _one)
    // 52
    const _numberOfWeeksInYear: number = 52
    console.log("_numberOfWeeksInYear", _numberOfWeeksInYear)


    // @notice New calculation based on the doc
    /// @TODO Check _whitelistedTVM
    // umaRewardsPercentage = (`totalTokensOutstanding` * synthPrice) / whitelistedTVM
    let umaRewardsPercentage: number = (_tokenCount * _tokenPrice) / _whitelistedTVM;
    console.log("umaRewardsPercentage", umaRewardsPercentage.toString())

    // dynamicAmountPerWeek = 50,000 * umaRewardsPercentage
    const dynamicAmountPerWeek: number = _umaRewards * umaRewardsPercentage;
    console.log("dynamicAmountPerWeek", dynamicAmountPerWeek.toString())

    // dynamicAmountPerWeekInDollars = dynamicAmountPerWeek * UMA price
    const dynamicAmountPerWeekInDollars: number = dynamicAmountPerWeek * _umaPrice;
    console.log("dynamicAmountPerWeekInDollars", dynamicAmountPerWeekInDollars.toString())

    // standardWeeklyRewards = dynamicAmountPerWeekInDollars * developerRewardsPercentage
    const standardWeeklyRewards: number = dynamicAmountPerWeekInDollars * _developerRewardsPercentage;
    console.log("standardWeeklyRewards", standardWeeklyRewards.toString())

    // totalWeeklyRewards = (standardRewards) + (Additional UMA * UMA price) + (Additional Yam * Yam Price)
    const totalWeeklyRewards: number = standardWeeklyRewards + _additionalWeekRewards;
    console.log("totalWeeklyRewards", totalWeeklyRewards.toString())

    // sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards / (Synth in AMM pool * synth price)
    const sponsorAmountPerDollarMintedPerWeek: number = totalWeeklyRewards / _calcAsset;
    console.log("sponsorAmountPerDollarMintedPerWeek", sponsorAmountPerDollarMintedPerWeek.toString())

    // collateralEfficiency = 1 / (CR + 1)
    const collateralEfficiency: number = 1 / (cr + 1)
    console.log("collateralEfficiency", collateralEfficiency)

    // General APR = (sponsorAmountPerDollarMintedPerWeek * chosen collateralEfficiency * 52)
    let generalAPR: number = sponsorAmountPerDollarMintedPerWeek * collateralEfficiency * _numberOfWeeksInYear * 100;
    console.log("generalAPR", generalAPR.toString())
    console.log("------------------------------------")

    if (generalAPR === Infinity) {
      generalAPR = 0;
    }

    sessionStorage.setItem(assetName, generalAPR.toString());

    return generalAPR.toString();
  } catch (e) {
    console.error("error", e);
    return 0;
  }
};
// Get USD price of token and cache to sessionstorage
/*
export const getUsdPrice = async (tokenAddress: string) => {
  const cached = sessionStorage.getItem(tokenAddress);
  if (cached) return Promise.resolve(Number(cached));

  try {
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${tokenAddress}&vs_currencies=usd`);
    const price = Number(res.data[tokenAddress].usd);
    sessionStorage.setItem(tokenAddress, price.toString());
    return Promise.resolve(price);
  } catch (err) {
    return Promise.reject(err);
  }
};
*/

const getEmpData = async (ethersProvider: ethers.providers.JsonRpcProvider, network: string) => {
  const cached = sessionStorage.getItem("empData");
  if (cached) return cached;

  /// @dev Get dev mining emp
  const devMiningEmp = await getDevMiningEmps(network);

  /// @dev Construct devMiningCalculator
  const devmining =  devMiningCalculator({
    provider: ethersProvider,
    ethers: ethers,
    getPrice: getPriceByContract,
    empAbi: EMPContract.abi,
    erc20Abi: erc20.abi,
  });

  /// @dev Get emp info from devMiningCalculator
  // const getEmpInfo: any = await devmining.utils.getEmpInfo(
  //   asset.emp.address
  // );

  /// @dev Get dev mining reward estimation from devMiningCalculator
  const estimateDevMiningRewards = await devmining.estimateDevMiningRewards(
    {
      /* @ts-ignore */
      totalRewards: devMiningEmp["totalReward"],
      /* @ts-ignore */
      empWhitelist: devMiningEmp["empWhitelist"],
    }
  );

  // TODO Object.fromEntries(estimateDevMiningRewards)
  /// @dev Structure rewards
  const rewards: any = {};
  let whitelistedTVM: string = "";
  for (let i = 0; i < estimateDevMiningRewards.length; i++) {
    rewards[estimateDevMiningRewards[i][0]] =
      estimateDevMiningRewards[i][1];
    whitelistedTVM = estimateDevMiningRewards[i][2];
  }

  sessionStorage.setItem("empData", JSON.stringify({ rewards, whitelistedTVM }));

  return JSON.stringify({ rewards, whitelistedTVM })
}

const mergeUnique = (arr1: any, arr2: any) => {
  return arr1.concat(
    arr2.filter(function (item: any) {
      return arr1.indexOf(item) === -1;
    })
  );
};

const getDevMiningEmps = async (network: String) => {
  /* @ts-ignore */
  const assets: AssetGroupModel = Assets[network];
  if (assets) {
    /* @ts-ignore */
    const data = [
      /* @ts-ignore */
      assets["uGas"][1].emp.address,
      /* @ts-ignore */
      assets["uGas"][2].emp.address,
      /* @ts-ignore */
      assets["uGas"][3].emp.address,
      /* @ts-ignore */
      assets["uStonks"][0].emp.address,
      /* @ts-ignore */
      assets["uStonks"][1].emp.address,
    ];
    const umadata: any = await fetch(
      `https://raw.githubusercontent.com/UMAprotocol/protocol/master/packages/affiliates/payouts/devmining-status.json`
    );
    const umaDataJson = await umadata.json();
    const empWhitelistUpdated = mergeUnique(
      umaDataJson["empWhitelist"],
      data
    );
    const umaObject = {
      empWhitelist: empWhitelistUpdated,
      totalReward: umaDataJson["totalReward"],
    };

    return umaObject;
  } else {
    return -1;
  }
};

const getContractInfo = async (address: string) => {
  const data: any = await fetch(
    `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`
  );
  const jsonData = await data.json();
  return jsonData;
};

const getPriceByContract = async (address: string, toCurrency?: string) => {
  // TODO: Remove while loop
  let result = await getContractInfo(address);
  while (!result) {
    result = await getContractInfo(address);
  }
  return (
    result &&
    result.market_data &&
    result.market_data.current_price[toCurrency || "usd"]
  );
};


export function devMiningCalculator({
  provider,
  ethers,
  getPrice,
  empAbi,
  erc20Abi,
}: DevMiningCalculatorParams) {
  const { utils, BigNumber, FixedNumber } = ethers;
  const { parseEther } = utils;
  async function getEmpInfo(address: string, toCurrency = "usd") {
    const emp = new ethers.Contract(address, empAbi, provider);
    const tokenAddress = await emp.tokenCurrency();
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    /// @dev Fetches the token price from coingecko using getPriceByContract (getPrice == getPriceByContract)
    const tokenPrice = await getPrice(tokenAddress, toCurrency).catch(
      () => null
    );
    const tokenCount = (await emp.totalTokensOutstanding()).toString();
    const tokenDecimals = (await tokenContract.decimals()).toString();

    const collateralAddress = await emp.collateralCurrency();
    const collateralContract = new ethers.Contract(
      collateralAddress,
      erc20Abi,
      provider
    );
    /// @dev Fetches the collateral price from coingecko using getPriceByContract (getPrice == getPriceByContract)
    const collateralPrice = await getPrice(collateralAddress, toCurrency).catch(
      () => null
    );
    const collateralCount = (await emp.totalPositionCollateral()).toString();
    const collateralDecimals = (await collateralContract.decimals()).toString();
    const collateralRequirement = (
      await emp.collateralRequirement()
    ).toString();

    return {
      address,
      toCurrency,
      tokenAddress,
      tokenPrice,
      tokenCount,
      tokenDecimals,
      collateralAddress,
      collateralPrice,
      collateralCount,
      collateralDecimals,
      collateralRequirement,
    };
  }
  /// @dev Returns a fixed number
  function calculateEmpValue({
    tokenPrice,
    tokenDecimals,
    collateralPrice,
    collateralDecimals,
    tokenCount,
    collateralCount,
    collateralRequirement,
  }: {
    tokenPrice: number;
    tokenDecimals: number;
    collateralPrice: number;
    collateralDecimals: number;
    tokenCount: number;
    collateralCount: number;
    collateralRequirement: number;
  }) {
    /// @dev If we have a token price, use this first to estimate EMP value
    if (tokenPrice) {
      const fixedPrice = FixedNumber.from(tokenPrice.toString());
      const fixedSize = FixedNumber.fromValue(tokenCount, tokenDecimals);
      return fixedPrice.mulUnsafe(fixedSize);
    }

    /** @dev Theres no token price then fallback to collateral price divided by
      * the collateralization requirement (usually 1.2) this should give a
      * ballpack of what the total token value will be. Its still an over estimate though.
     */
    if (collateralPrice) {
      const fixedPrice = FixedNumber.from(collateralPrice.toString());
      const collFixedSize = FixedNumber.fromValue(
        collateralCount,
        collateralDecimals
      );
      return fixedPrice
        .mulUnsafe(collFixedSize)
        .divUnsafe(FixedNumber.fromValue(collateralRequirement, 18));
    }
    throw new Error(
      "Unable to calculate emp value, no token price or collateral price"
    );
  }

  async function estimateDevMiningRewards({
    totalRewards,
    empWhitelist,
  }: {
    totalRewards: number;
    empWhitelist: string[];
  }) {
    const allInfo = await Promise.all(
      empWhitelist.map((address) => getEmpInfo(address))
    );

    const values: any[] = [];
    /// @dev Returns the whitelisted TVM
    const totalValue = allInfo.reduce((totalValue, info) => {
      const value = calculateEmpValue(info);
      values.push(value);
      return totalValue.addUnsafe(value);
    }, FixedNumber.from("0"));

    return allInfo.map((info, i): [string, string, string] => {
      return [
        info.address,
        values[i]
          .mulUnsafe(FixedNumber.from(totalRewards))
          .divUnsafe(totalValue)
          .toString(),
        totalValue.toString()
      ];
    });
  }

  return {
    estimateDevMiningRewards,
    utils: {
      getEmpInfo,
      calculateEmpValue,
    },
  };
}
