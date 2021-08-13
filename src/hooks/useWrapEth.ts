import { useContext, useState, useEffect } from 'react';
import { utils } from 'ethers';
import { useEthers } from '@usedapp/core';

import { MarketContext } from '@/contexts';
import { Weth__factory, Weth } from '@/types/contracts';
import { isEmpty } from '@/utils';

export const useWrapEth = () => {
  const { collateralData } = useContext(MarketContext);
  const { library } = useEthers();
  const signer = library?.getSigner();

  const [wethContract, setWethContract] = useState<Weth>();

  useEffect(() => {
    if (!isEmpty(collateralData) && signer) {
      const wethAddress = collateralData['WETH'].address;
      setWethContract(Weth__factory.connect(wethAddress, signer));
    }
  }, [signer, collateralData]);

  const wrapEth = async (ethAmount: number) => {
    const amount = utils.parseEther(ethAmount.toString());
    const tx = await wethContract?.deposit({ value: amount });
    return tx?.wait();
  };

  return wrapEth;
};
