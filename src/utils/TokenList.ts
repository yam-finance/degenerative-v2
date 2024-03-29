import Assets from '@/assets/assets.json';
import Collateral from '@/assets/collateral.json';
import Groups from '@/assets/groups.json';
import { IToken, ISynth, ISynthGroup } from '@/types';

const ChainMap: Record<number, string> = {
  1: 'mainnet',
  42: 'kovan',
  1337: 'mainnet',
};

//export const SynthMap: IMap<ISynth> = Synths;
export const CollateralMap: any = Collateral;
export const SynthGroups: Record<string, ISynthGroup> = Groups;

export const getSynthMetadata = (chainId: number) => {
  const chain = ChainMap[chainId];
  const assets: any = Assets;

  const synthInfo: Record<string, ISynth> = {};
  const networkAssets = assets[chain];

  for (const group in networkAssets) {
    const image = SynthGroups[group].image ?? 'Box-01';

    networkAssets[group].forEach((synth: any) => {
      const name = `${group}-${synth.cycle}${synth.year}`;
      // Add in synth type information to object
      synthInfo[name] = {
        ...synth,
        imgLocation: `/images/${image}.png`,
        group: group,
      };
    });
  }

  return synthInfo;
};

export const getCollateralData = (chainId: number): Record<string, IToken> => CollateralMap[ChainMap[chainId]];
