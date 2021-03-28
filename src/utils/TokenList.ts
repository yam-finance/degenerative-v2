import Synths from '@/assets/synths.json';
import Collateral from '@/assets/collateral.json';
import Types from '@/assets/types.json';
import { ISynthInfo, IToken, IMap } from '@/types';

// TODO Convert original json into this object
export const SynthMap: IMap<ISynthInfo> = Synths;
export const CollateralMap: IMap<IToken> = Collateral;
export const SynthTypes: IMap<string> = Types;
