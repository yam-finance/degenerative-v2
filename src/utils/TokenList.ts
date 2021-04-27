import Collateral from '@/assets/collateral.json';
import Types from '@/assets/types.json'; // TODO rename to groups
import Assets from '@/assets/assets.json';
import AssetsNew from '@/assets/assets_new.json';
import { ISynthInfo, ISynthType, IToken } from '@/types';

const ChainMap: Record<number, string> = {
  1: 'mainnet',
  42: 'kovan',
  1337: 'mainnet',
};

//export const SynthMap: IMap<ISynthInfo> = Synths;
export const CollateralMap: Record<string, IToken> = Collateral;
export const SynthTypes: Record<string, ISynthType> = Types; // TODO make this map of all copy for synth types

export const getSynthMetadata = (chainId: number) => {
  const chain = ChainMap[chainId];
  const assets: any = AssetsNew;

  const synthInfo: Record<string, ISynthInfo> = {};
  const networkAssets = assets[chain];

  for (const group in networkAssets) {
    networkAssets[group].forEach((synth: any) => {
      const name = `${group}-${synth.cycle}${synth.year}`;
      // Add in synth type information to object
      synthInfo[name] = {
        ...synth,
        imgLocation: 'src/assets/Box-01.png', // TODO add image locations to json
        type: group,
      };
    });
  }

  return synthInfo;
};
