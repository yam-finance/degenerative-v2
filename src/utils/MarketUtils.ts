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

sessionStorage.clear();

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
 * @param {AssetModel} asset Asset object for the input
 * @param {AssetGroupModel} assetGroup Asset group of an asset for the input
 * @param {number} assetPrice Asset price
 * @param {number} cr Collateral Ratio
 * @public
 * @methods
 */
/* @ts-ignore */
export const getMiningRewards = async (asset: ISynth, collateralCount, tokenCount, synthTokenPrice, marketCap) => {
  // TODO Use passed params for setup instead of test setup
  const assetGroup = { name: 'UGAS', AssetModel: Assets['mainnet']['uGas'] };
  asset = asset;
  const assetPrice = 242.93;
  const cr = 1.5;
  const network = 'mainnet';

  const rpcURL = 'https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud';
  // const web3 = await new Web3(new Web3.providers.HttpProvider(rpcURL || ''));
  // const provider: ExternalProvider = new Web3Provider(web3.currentProvider as any).provider;
  const ethersProvider = new ethers.providers.JsonRpcProvider(rpcURL || '');

  // TODO Remove logs
  // console.log("assetGroup", assetGroup)
  // console.log("asset: ", asset)
  // console.log("assetPrice", assetPrice)
  // console.log("cr", cr)

  /// @dev Check if params are set
  if (!assetGroup || !asset || !assetPrice || !cr) {
    return 0;
  }

  try {
    /// @dev Get dev mining emp
    const devMiningEmp = await getDevMiningEmps(network);

    /// @dev Construct devMiningCalculator
    const devmining = await devMiningCalculator({
      provider: ethersProvider,
      ethers: ethers,
      getPrice: getPriceByContract,
      empAbi: EMPContract.abi,
      erc20Abi: erc20.abi,
    });

    /// @dev Get emp info from devMiningCalculator
    // const getEmpInfo: any = await devmining.utils.getEmpInfo(asset.emp.address);

    /// @dev Get dev mining reward estimation from devMiningCalculator
    const estimateDevMiningRewards = await devmining.estimateDevMiningRewards({
      /* @ts-ignore */
      totalRewards: devMiningEmp['totalReward'],
      /* @ts-ignore */
      empWhitelist: devMiningEmp['empWhitelist'],
    });

    // TODO Object.fromEntries(estimateDevMiningRewards)
    /// @dev Structure rewards
    const rewards: any = Object.fromEntries(estimateDevMiningRewards);
    // for (let i = 0; i < estimateDevMiningRewards.length; i++) {
    //   rewards[estimateDevMiningRewards[i][0]] = estimateDevMiningRewards[i][1];
    // }

    /// @dev Setup base variables for calculation
    let baseCollateral;
    const baseAsset = BigNumber.from(10).pow(asset.token.decimals);

    /// @dev Setup contract calls
    const contractLp = new ethers.Contract(asset.pool.address, UNIContract.abi, ethersProvider);
    const contractLpCall = await contractLp.getReserves();
    // const contractEmp = new this.options.web3.eth.Contract((EMPContract.abi as unknown) as AbiItem, asset.emp.address);
    // const contractEmpCall = await contractEmp.methods.rawTotalPositionCollateral().call();

    /// @dev Get prices for relevant tokens
    const ethPrice = await getPriceByContract(WETH);
    const umaPrice = await getPriceByContract(UMA);
    const yamPrice = await getPriceByContract(YAM);
    // const tokenPrice = await getPriceByContract(address);

    /// @dev Temp pricing
    let tokenPrice;
    if (asset.collateral === 'USDC') {
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
    const week1Until = 1615665600;
    const week2Until = 1616961600;
    const yamRewards = 0;
    const umaRewards = await rewards[asset.emp.address];
    let yamWeekRewards = 0;
    let umaWeekRewards = 0;
    if (assetGroup.name.toUpperCase() === 'UGAS' && asset.cycle === 'JUN' && asset.year === '21') {
      if (current < week1Until) {
        yamWeekRewards += 5000;
      } else if (current < week2Until) {
        yamWeekRewards += 10000;
      }
    } else if (assetGroup.name.toUpperCase() === 'USTONKS' && asset.cycle === 'APR' && asset.year === '21') {
      if (current < week1Until) {
        umaWeekRewards += 5000;
        yamWeekRewards += 5000;
      } else if (current < week2Until) {
        umaWeekRewards += 10000;
        yamWeekRewards += 10000;
      }
    }

    /// @dev Calculate rewards
    let calcAsset = 0;
    let calcCollateral = 0;
    const normalRewards = umaRewards * umaPrice + yamRewards * yamPrice;
    const weekRewards = umaWeekRewards * umaPrice + yamWeekRewards * yamPrice;
    const assetReserve0 = BigNumber.from(contractLpCall._reserve0).div(baseAsset).toNumber();
    const assetReserve1 = BigNumber.from(contractLpCall._reserve1).div(baseCollateral).toNumber();

    if (assetGroup.name === 'USTONKS') {
      calcAsset = assetReserve1 * tokenPrice;
      calcCollateral = assetReserve0 * (asset.collateral == 'WETH' ? ethPrice : 1);
    } else {
      calcAsset = assetReserve0 * tokenPrice;
      calcCollateral = assetReserve1 * (asset.collateral == 'WETH' ? ethPrice : 1);
    }

    console.log('-----');
    console.log('tokenCount', tokenCount);
    console.log('tokenPrice', tokenPrice);
    console.log('collateralCount', collateralCount);
    console.log('umaRewards', umaRewards);
    console.log('umaPrice', umaPrice);
    console.log('weekRewards', weekRewards);
    console.log('calcAsset', calcAsset);
    console.log('-----');

    // @notice New calculation based on the doc
    // umaRewardsPercentage = (`totalTokensOutstanding` * synthPrice) / whitelistedTVM
    let umaRewardsPercentage = BigNumber.from(tokenCount).mul(tokenPrice);
    // TODO Calculate whitelistedTVM
    umaRewardsPercentage = umaRewardsPercentage.div(10000);
    // dynamicAmountPerWeek = 50,000 * umaRewardsPercentage
    const dynamicAmountPerWeek = umaRewardsPercentage.mul(umaRewards);
    // dynamicAmountPerWeekInDollars = dynamicAmountPerWeek * UMA price
    const dynamicAmountPerWeekInDollars = dynamicAmountPerWeek.mul(umaPrice);
    // standardWeeklyRewards = dynamicAmountPerWeekInDollars * developerRewardsPercentage
    const standardWeeklyRewards = dynamicAmountPerWeekInDollars.mul(0.82);
    // totalWeeklyRewards = (standardRewards) + (Additional UMA * UMA price) + (Additional Yam * Yam Price)
    const totalWeeklyRewards = standardWeeklyRewards.add(weekRewards);
    // sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards / (Synth in AMM pool * synth price)
    const sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards.div(calcAsset);
    // collateralEfficiency = 1 / (CR + 1)
    const collateralEfficiency = BigNumber.from(1).div(BigNumber.from(cr).add(1));
    // General APR = (sponsorAmountPerDollarMintedPerWeek * chosen collateralEfficiency * 52)
    const generalAPR = sponsorAmountPerDollarMintedPerWeek.mul(collateralEfficiency).mul(52).toNumber();

    // // @notice New calculation based on the doc
    // const convertedTokenCount = parseInt(utils.formatEther(tokenCount));

    // // umaRewardsPercentage = (`totalTokensOutstanding` * synthPrice) / whitelistedTVM
    // let umaRewardsPercentage = (collateralCount * synthTokenPrice) / 1304256103561098948665;
    // console.log('collateralCount', collateralCount);
    // console.log('synthTokenPrice', synthTokenPrice);
    // console.log('convertedTokenCount', convertedTokenCount);
    // console.log('umaRewardsPercentage', umaRewardsPercentage);

    // // dynamicAmountPerWeek = 50,000 * umaRewardsPercentage
    // const dynamicAmountPerWeek = umaRewardsPercentage * 50_000;
    // console.log('umaRewards', umaRewards);
    // console.log('dynamicAmountPerWeek', dynamicAmountPerWeek);

    // // dynamicAmountPerWeekInDollars = dynamicAmountPerWeek * UMA price
    // const dynamicAmountPerWeekInDollars = dynamicAmountPerWeek * umaPrice;
    // console.log('umaPrice', umaPrice);
    // console.log('dynamicAmountPerWeekInDollars', dynamicAmountPerWeekInDollars);

    // // standardWeeklyRewards = dynamicAmountPerWeekInDollars * developerRewardsPercentage
    // const standardWeeklyRewards = dynamicAmountPerWeekInDollars * 0.82;
    // console.log('standardWeeklyRewards', standardWeeklyRewards);

    // // totalWeeklyRewards = (standardRewards) + (Additional UMA * UMA price) + (Additional Yam * Yam Price)
    // const totalWeeklyRewards = standardWeeklyRewards + weekRewards;
    // console.log('weekRewards', weekRewards);
    // console.log('totalWeeklyRewards', totalWeeklyRewards);

    // // sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards / (Synth in AMM pool * synth price)
    // const sponsorAmountPerDollarMintedPerWeek = totalWeeklyRewards / calcAsset;
    // console.log('calcAsset', calcAsset);
    // console.log('sponsorAmountPerDollarMintedPerWeek', sponsorAmountPerDollarMintedPerWeek);

    // // collateralEfficiency = 1 / (CR + 1)
    // const collateralEfficiency = 1 / (cr + 1);
    // console.log('collateralEfficiency', collateralEfficiency);

    // // General APR = (sponsorAmountPerDollarMintedPerWeek * chosen collateralEfficiency * 52)
    // const generalAPR = sponsorAmountPerDollarMintedPerWeek * collateralEfficiency * 52;
    // console.log('generalAPR', generalAPR);

    // TODO: Remove old calculations
    // @notice Old apr calculation
    // ((dynamicAmountPerWeek * 52) * umaTokenPrice / 2) / (empCollateral + 50% totalCombinedLp) * 100
    // let empTVL = BigNumber.from(contractEmpCall).div(baseAsset).toNumber();
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
    console.error('error', e);
    return 0;
  }
};

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
      assets['uGas'][1].emp.address,
      /* @ts-ignore */
      assets['uGas'][2].emp.address,
      /* @ts-ignore */
      assets['uGas'][3].emp.address,
      /* @ts-ignore */
      assets['uStonks'][0].emp.address,
    ];
    const umadata: any = await fetch(
      `https://raw.githubusercontent.com/UMAprotocol/protocol/master/packages/affiliates/payouts/devmining-status.json`
    );
    const umaDataJson = await umadata.json();
    const empWhitelistUpdated = mergeUnique(umaDataJson['empWhitelist'], data);
    const umaObject = { empWhitelist: empWhitelistUpdated, totalReward: umaDataJson['totalReward'] };

    return umaObject;
  } else {
    return -1;
  }
};

const getContractInfo = async (address: string) => {
  const data: any = await fetch(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
  const jsonData = await data.json();
  return jsonData;
};

const getPriceByContract = async (address: string, toCurrency?: string) => {
  // TODO: Remove while loop
  let result = await getContractInfo(address);
  while (!result) {
    result = await getContractInfo(address);
  }
  return result && result.market_data && result.market_data.current_price[toCurrency || 'usd'];
};

export function devMiningCalculator({ provider, ethers, getPrice, empAbi, erc20Abi }: DevMiningCalculatorParams) {
  const { utils, BigNumber, FixedNumber } = ethers;
  const { parseEther } = utils;
  async function getEmpInfo(address: string, toCurrency = 'usd') {
    const emp = new ethers.Contract(address, empAbi, provider);
    const tokenAddress = await emp.tokenCurrency();
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const tokenPrice = await getPrice(tokenAddress, toCurrency).catch(() => null);
    console.log('Fetched token Price: ', tokenPrice);
    const tokenCount = (await emp.totalTokensOutstanding()).toString();
    const tokenDecimals = (await tokenContract.decimals()).toString();

    const collateralAddress = await emp.collateralCurrency();
    const collateralContract = new ethers.Contract(collateralAddress, erc20Abi, provider);
    const collateralPrice = await getPrice(collateralAddress, toCurrency).catch(() => null);
    console.log('Fetched collateral Price: ', collateralPrice);
    const collateralCount = (await emp.totalPositionCollateral()).toString();
    const collateralDecimals = (await collateralContract.decimals()).toString();
    const collateralRequirement = (await emp.collateralRequirement()).toString();

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
      const collFixedSize = FixedNumber.fromValue(collateralCount, collateralDecimals);
      return fixedPrice.mulUnsafe(collFixedSize).divUnsafe(FixedNumber.fromValue(collateralRequirement, 18));
    }
    throw new Error('Unable to calculate emp value, no token price or collateral price');
  }

  async function estimateDevMiningRewards({
    totalRewards,
    empWhitelist,
  }: {
    totalRewards: number;
    empWhitelist: string[];
  }) {
    const allInfo = await Promise.all(empWhitelist.map((address) => getEmpInfo(address)));

    const values: any[] = [];
    const totalValue = allInfo.reduce((totalValue, info) => {
      const value = calculateEmpValue(info);
      values.push(value);
      return totalValue.addUnsafe(value);
    }, FixedNumber.from('0'));

    return allInfo.map((info, i): [string, string] => {
      return [info.address, values[i].mulUnsafe(FixedNumber.from(totalRewards)).divUnsafe(totalValue).toString()];
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
