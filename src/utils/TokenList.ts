//import Synths from '@/assets/synths.json';
import Collateral from '@/assets/collateral.json';
// TODO rename to descriptions
import Descriptions from '@/assets/descriptions.json';
import Assets from '@/assets/assets.json';
import { ISynthInfo, IToken, IMap } from '@/types';

// TODO Convert original json into this object
//export const SynthMap: IMap<ISynthInfo> = Synths;
export const CollateralMap: IMap<IToken> = Collateral;
export const SynthCopy: IMap<string> = Descriptions; // TODO make this map of all copy for synths

// Entry will be indexed by the name eg. uGas-JAN21
export const SynthInfo: IMap<ISynthInfo> = (() => {
  const synthInfo: IMap<ISynthInfo> = {};
  const assets: any = Assets;

  for (const type in assets) {
    assets[type].forEach((synth: any) => {
      const name = `${type}-${synth.cycle}${synth.year}`;
      // Add in synth type information to object
      synthInfo[name] = {
        ...synth,
        type: type,
      };
    });
  }

  return synthInfo;
})();
