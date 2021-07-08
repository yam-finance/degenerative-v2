import Assets from '@/assets/assets.json';
import Collateral from '@/assets/collateral.json';
import Groups from '@/assets/groups.json';
import { ISynth } from '@/types';

const ChainMap = {
  '1': 'mainnet',
  '42': 'kovan',
  '1337': 'mainnet',
};

//export const SynthMap: IMap<ISynth> = Synths;
export const CollateralMap = Collateral;
export const SynthGroups = Groups;

export const getSynthMetadata = (chainId: number) => {
  const chain = ChainMap[chainId.toString() as keyof typeof ChainMap];
  const assets = Assets;

  const synthInfo: Record<string, ISynth> = {};
  const networkAssets = assets[chain as keyof typeof assets];

  for (const [group, assets] of Object.entries(networkAssets)) {
    const groupKey = group as keyof typeof SynthGroups;
    const image = SynthGroups[groupKey]?.image ?? 'Box-01';

    assets.forEach((synth) => {
      const name = `${group}-${synth.cycle}${synth.year}`;
      // Add in synth type information to object
      synthInfo[name] = ({
        ...synth,
        imgLocation: `/images/${image}.png`,
        group: group,
      } as unknown) as ISynth;
    });
  }

  return synthInfo;
};

export const getCollateralData = (chainId: number) =>
  CollateralMap[ChainMap[chainId.toString() as keyof typeof ChainMap] as keyof typeof CollateralMap];
