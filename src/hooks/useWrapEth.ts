import { useContext, useEffect, useState } from 'react';
import { Signer, utils } from 'ethers';

import { EthereumContext, MarketContext } from '@/contexts';
import { Weth, Weth__factory } from '@/types/contracts';
import { isEmpty } from '@/utils';

export const useWrapEth = () => {
  const { collateralData = {} } = useContext(MarketContext) ?? {};
  const { signer } = useContext(EthereumContext) ?? {};

  const [wethContract, setWethContract] = useState<Weth>();

  useEffect(() => {
    if (!isEmpty(collateralData)) {
      const wethAddress = collateralData['WETH'].address;
      setWethContract(Weth__factory.connect(wethAddress, signer as Signer));
    }
  }, [signer, collateralData]);

  return async (ethAmount: number) => {
    const amount = utils.parseEther(ethAmount.toString());
    const tx = await wethContract?.deposit({ value: amount });
    return tx?.wait();
  };
};
