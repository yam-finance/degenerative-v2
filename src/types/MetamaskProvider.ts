import { EventType, Listener } from '@ethersproject/abstract-provider';
import { providers } from 'ethers';

// interface RequestArguments {
//   method: string;
//   params?: any;
// }

export interface MetamaskProvider {
  //request(args: RequestArguments): Promise<any>;
  emit(eventName: EventType): () => never;

  addListener(eventName: EventType, listener?: Listener): () => never;

  removeListener(eventName: EventType, listener?: Listener): () => never;
}

declare global {
  interface Window {
    ethereum?: providers.ExternalProvider & MetamaskProvider;
  }
}
