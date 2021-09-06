import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'
import { FortmaticConnector } from '@web3-react/fortmatic-connector'
import { PortisConnector } from '@web3-react/portis-connector'


const POLLING_INTERVAL = 12000
const RPC_URLS: { [chainId: number]: string } = {
  1: 'https://mainnet.infura.io/v3/e97472e46b4f4c4c8720c51041bc0c1b' 
  
}

export const injected = new InjectedConnector({ supportedChainIds: [1, 3, 4, 5, 42] })



export const walletconnect = new WalletConnectConnector({
  
 // rpc: { 1: RPC_URLS[1] },
 infuraId: 'e97472e46b4f4c4c8720c51041bc0c1b',
  qrcode: true
})




export const fortmatic = new FortmaticConnector({ apiKey: 'pk_live_2B1E18021320B71B' as string, chainId: 1 })



export const portis = new PortisConnector({ dAppId: 'f06d1b39-ce54-4deb-91ab-2c591a942544' as string, networks: [1] })


