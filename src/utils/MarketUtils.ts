import { request } from 'graphql-request';
import axios from 'axios';
import { sub, getUnixTime, fromUnixTime, formatISO, parseISO } from 'date-fns';
import zonedTimeToUtc from 'date-fns-tz/zonedTimeToUtc';
import { utils, constants, ethers, providers} from 'ethers';
import BigNumber from "bignumber.js";
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
import { ISynth, IToken, ILiquidityPool, Empv2__factory, Uni__factory, Erc20__factory} from '@/types';
import UNIContract from "../../abi/uni.json";
import erc20 from "../../abi/erc20.json"
import moment from "moment";
import Assets from '@/assets/assets.json'

export const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
export const YAM = "0x0AaCfbeC6a24756c20D41914F2caba817C0d8521";
export const UMA = "0x04fa0d235c4abf4bcf4787af4cf447de572ef828"

type DevMiningCalculatorParams = {
  ethers: any;
  getPrice: any;
  empAbi: any;
  erc20Abi: any;
  provider: any;
};

interface AssetModel {
  name: string;
  cycle: string;
  year: string;
  collateral: string;
  token: TokenModel;
  emp: EmpModel;
  pool: PoolModel;
  apr?: AprModel;
}

interface TokenModel {
  address: string;
  decimals: number;
}

interface EmpModel {
  address: string;
  new: boolean;
}

interface PoolModel {
  address: string;
}

interface AprModel {
  force: number;
  extra: number;
}

const EthNodeProvider = new providers.JsonRpcProvider(
  'https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud'
)

sessionStorage.clear();

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

// **** START OF APR CALCULATION ****

/**
* Fetch the mining rewards
* @param {AssetModel} asset Asset object for the input
* @param cr assetGroup Asset group of an asset for the input
* @public
* @methods
*/
export const getMiningRewards = async (name: string, asset: ISynth, priceUsd: number, cr: number) => {
  // console.debug("sdk getMiningRewards", assetGroup, asset, assetPrice);
  // const assetGroup: AssetGroupModel = Assets["mainnet"];
  console.log(priceUsd)
  const assetPrice = priceUsd;
  if (!asset || !assetPrice) {
    return 0
  }
  try {
    // TODO Make network param dynamic
    const emps = await getDevMiningEmps("mainnet");
    const signer = EthNodeProvider.getSigner();
    const empContract = Empv2__factory.connect(asset.emp.address, signer);
    const lpContract = Uni__factory.connect(asset.pool.address, signer)
    const devmining = await DevMiningCalculator({
      provider: signer,
      ethers: ethers,
      getPrice: getPriceByContract,
      empAbi: empContract,
      erc20Abi: erc20.abi
    });
    const getEmpInfo: any = await devmining.utils.getEmpInfo(asset.emp.address);
    console.debug("getEmpInfo", { tokenCount: getEmpInfo.tokenCount, price: getEmpInfo.tokenPrice, decimals: getEmpInfo.collateralDecimals, });
    // const calculateEmpValue = await devmining.utils.calculateEmpValue(getEmpInfo);
    // console.debug("calculateEmpValue", calculateEmpValue);
    const estimateDevMiningRewards = await devmining.estimateDevMiningRewards({
      totalRewards: emps.totalReward,
      empWhitelist: emps.empWhitelist,
    });
    // console.debug("estimateDevMiningRewards", estimateDevMiningRewards);
    const rewards: any = {};
    for (let i = 0; i < estimateDevMiningRewards.length; i++) {
      rewards[estimateDevMiningRewards[i][0]] = estimateDevMiningRewards[i][1];
    }
    const baseGeneral = new BigNumber(10).pow(18);
    const baseAsset = new BigNumber(10).pow(asset.token.decimals);
    let baseCollateral;
    // const lpContract = new ethers.Contract(asset.pool.address, UNIContract.abi, EthNodeProvider);
    // const lpContract = new this.options.web3.eth.Contract((UNIContract.abi as unknown) as AbiItem, asset.pool.address);
    // const contractEmp = new ethers.Contract(asset.emp.address, EMPContract.abi, EthNodeProvider)
    // const contractEmp = new this.options.web3.eth.Contract((EMPContract.abi as unknown) as AbiItem, asset.emp.address);
    const contractLpCall = await lpContract.getReserves();
    const contractEmpCall = await empContract.rawTotalPositionCollateral();
    const ethPrice = await getPriceByContract(WETH);
    const umaPrice = await getPriceByContract(UMA);
    const yamPrice = await getPriceByContract(YAM);
    // const tokenPrice = await getPriceByContract(address);

    // temp pricing
    let tokenPrice;
    if (asset.collateral.toUpperCase() === "USDC") {
      baseCollateral = new BigNumber(10).pow(6);
      tokenPrice = assetPrice * 1;
      // } else if(assetInstance.collateral === "YAM"){
      //   tokenPrice = assetPrice * yamPrice;
    } else {
      baseCollateral = new BigNumber(10).pow(18);
      // tokenPrice = assetPrice * ethPrice;
      tokenPrice = assetPrice * 1;
    }

    const current = moment().unix();
    const week1Until = 1615665600;
    const week2Until = 1616961600;
    const yamRewards = 0;
    const umaRewards = rewards[asset.emp.address];
    let yamWeekRewards = 0;
    let umaWeekRewards = 0;
    if (asset.group.toUpperCase() === "UGAS" && asset.cycle === "JUN" && asset.year === "21") {
      if (current < week1Until) {
        yamWeekRewards += 5000;
      } else if (current < week2Until) {
        yamWeekRewards += 10000;
      }
    } else if (asset.group.toUpperCase() === "USTONKS" && asset.cycle === "APR" && asset.year === "21") {
      if (current < week1Until) {
        umaWeekRewards += 5000;
        yamWeekRewards += 5000;
      } else if (current < week2Until) {
        umaWeekRewards += 10000;
        yamWeekRewards += 10000;
      }
    }

    let calcAsset = 0;
    let calcCollateral = 0;
    const normalRewards = umaRewards * umaPrice + yamRewards * yamPrice;
    const weekRewards = umaWeekRewards * umaPrice + yamWeekRewards * yamPrice;
    const assetReserve0 = new BigNumber(contractLpCall._reserve0.toNumber()).dividedBy(baseAsset).toNumber();
    const assetReserve1 = new BigNumber(contractLpCall._reserve1.toNumber()).dividedBy(baseCollateral).toNumber();
    if (asset.group === "USTONKS") {
      calcAsset = assetReserve1 * tokenPrice;
      calcCollateral = assetReserve0 * (asset.collateral == "WETH" ? ethPrice : 1);
    } else {
      calcAsset = assetReserve0 * tokenPrice;
      calcCollateral = assetReserve1 * (asset.collateral == "WETH" ? ethPrice : 1);
    }


    // @notice New calculation based on the doc
    // umaRewardsPercentage = (`totalTokensOutstanding` * synthPrice) / whitelistedTVM
    let umaRewardsPercentage = new BigNumber(getEmpInfo.collateralCount).multipliedBy(getEmpInfo.tokenPrice)
    umaRewardsPercentage = umaRewardsPercentage.dividedBy(getEmpInfo.tokenCount) 
    // dynamicAmountPerWeek = 50,000 * umaRewardsPercentage 
    const dynamicAmountPerWeek = umaRewardsPercentage.multipliedBy(umaRewards) 
    // dynamicAmountPerWeekInDollars = dynamicAmountPerWeek * UMA price
    const dynamicAmountPerWeekInDollars = dynamicAmountPerWeek.multipliedBy(umaPrice) 
    // standardWeeklyRewards = dynamicAmountPerWeekInDollars * developerRewardsPercentage
    const standardWeeklyRewards = dynamicAmountPerWeekInDollars.multipliedBy(0.82) 
    // totalWeeklyRewards = (standardRewards) + (Additional UMA * UMA price) + (Additional Yam * Yam Price)
    const totalWeeklyRewards = standardWeeklyRewards.plus(weekRewards)
    // sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards / (Synth in AMM pool * synth price)
    const sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards.dividedBy(calcAsset)
    // collateralEfficiency = 1 / (CR + 1)
    const collateralEfficiency = new BigNumber(1).dividedBy(new BigNumber(cr).plus(1))
    // General APR = (sponsorAmountPerDollarMintedPerWeek * chosen collateralEfficiency * 52)  
    const generalAPR = sponsorAmountPerDollarMintedPerWeek.multipliedBy(collateralEfficiency).multipliedBy(52).toNumber() 

    console.log(
      umaRewardsPercentage,
      dynamicAmountPerWeek,
      dynamicAmountPerWeekInDollars,
      standardWeeklyRewards,
      totalWeeklyRewards,
      sponsorAmountPerDollarMintedPerWeek,
      collateralEfficiency 
    )

    // @notice This is the old apr calculation
    // TODO: Remove old calculations 
    // ((dynamicAmountPerWeek * 52) * umaTokenPrice / 2) / (empCollateral + 50% totalCombinedLp) * 100 
    // let empTVL = new BigNumber(contractEmpCall).dividedBy(baseAsset).toNumber();
    // empTVL *= (asset.collateral == "WETH" ? ethPrice : 1);
    // const uniLpPair = calcAsset + calcCollateral;
    // const assetReserveValue = empTVL + (uniLpPair * 0.5);
    // console.debug("assetReserveValue", assetReserveValue);
    // const aprCalculate = (((normalRewards * 52 * 0.82) / assetReserveValue) * 100);
    // const aprCalculateExtra = (((weekRewards * 52) / assetReserveValue) * 100);
    // const totalAprCalculation = aprCalculate + aprCalculateExtra;
    // console.debug("aprCalculate %", totalAprCalculation);
    return generalAPR;
  } catch (e) {
    console.error("error", e);
    return 0;
  }
};

export function DevMiningCalculator({
  provider,
  ethers,
  getPrice,
  empAbi,
  erc20Abi,
}: DevMiningCalculatorParams) {
  const { utils, BigNumber, FixedNumber } = ethers;
  const { parseEther } = utils;
  async function getEmpInfo(address: string, toCurrency = "usd") {
    const emp = empAbi;
    const tokenAddress = await emp.tokenCurrency();
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
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
  // returns a fixed number
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
    // if we have a token price, use this first to estimate EMP value
    if (tokenPrice) {
      const fixedPrice = FixedNumber.from(tokenPrice.toString());
      const fixedSize = FixedNumber.fromValue(tokenCount, tokenDecimals);
      return fixedPrice.mulUnsafe(fixedSize);
    }
    // if theres no token price then fallback to collateral price divided by the collateralization requirement (usually 1.2)
    // this should give a ballpack of what the total token value will be. Its still an over estimate though.
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
    const totalValue = allInfo.reduce((totalValue, info) => {
      const value = calculateEmpValue(info);
      values.push(value);
      return totalValue.addUnsafe(value);
    }, FixedNumber.from("0"));

    return allInfo.map((info, i): [string, string] => {
      return [
        info.address,
        values[i]
          .mulUnsafe(FixedNumber.from(totalRewards))
          .divUnsafe(totalValue)
          .toString(),
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

export async function getContractInfo(address: string) {
  const data: any = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
  return data;
}

// TODO Replace function with indigos coingecko function
export async function getPriceByContract(address: string, toCurrency?: string) {
  // TODO: Remove while loop
  let result = await getContractInfo(address);
  while (!result) {
    result = await getContractInfo(address); 
  }
  return result && result.market_data && result.market_data.current_price[toCurrency || "usd"];
}

function mergeUnique(arr1: any, arr2: any) {
  return arr1.concat(
    arr2.filter(function (item: any) {
      return arr1.indexOf(item) === -1;
    })
  );
}

export async function getDevMiningEmps(network: string) {
  // TODO make network dynamic 
  const assets = Assets["mainnet"];
  if (assets) {
    const data = [assets["uGas"][1].emp.address, assets["uGas"][2].emp.address, assets["uGas"][3].emp.address, assets["uStonks"][0].emp.address];
    const umadata: any = await fetch(`https://raw.githubusercontent.com/UMAprotocol/protocol/master/packages/affiliates/payouts/devmining-status.json`);
    const empWhitelistUpdated = mergeUnique(umadata.empWhitelist, data);
    umadata.empWhitelist = empWhitelistUpdated;
    return umadata;
    // return emplistDataBackup;
  } else {
    return -1;
  }
}

// **** END OF APR CALCULATION ****

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
