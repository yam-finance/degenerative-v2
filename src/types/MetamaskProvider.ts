import { EventType, Listener } from '@ethersproject/abstract-provider';
import { providers } from 'ethers';

interface RequestArguments {
  method: string;
  params?: any;
}

export interface MetamaskProvider {
  //request(args: RequestArguments): Promise<any>;
  addListener(eventName: EventType, listener?: Listener): () => any;
  removeListener(eventName: EventType, listener?: Listener): () => any;
}

declare global {
  interface Window {
    ethereum?: providers.ExternalProvider & MetamaskProvider;
  }
}
