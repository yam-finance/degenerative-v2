import Collateral from '@/assets/collateral.json';
import Descriptions from '@/assets/descriptions.json';
import Assets from '@/assets/assets.json';
import { ISynthInfo, IToken, IMap } from '@/types';

//export const SynthMap: IMap<ISynthInfo> = Synths;
export const CollateralMap: IMap<IToken> = Collateral;
export const SynthCopy: IMap<string> = Descriptions; // TODO make this map of all copy for synth types

// Synth will be indexed by the name eg. uGas-JAN21
export const SynthInfo: IMap<ISynthInfo> = (() => {
  const synthInfo: IMap<ISynthInfo> = {};
  const assets: any = Assets;

  for (const type in assets) {
    assets[type].forEach((synth: any) => {
      const name = `${type}-${synth.cycle}${synth.year}`;
      // Add in synth type information to object
      synthInfo[name] = {
        ...synth,
        imgLocation: 'src/assets/Box-01.png', // TODO add image locations
        type: type,
      };
    });
  }

  return synthInfo;
})();
