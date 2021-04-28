import { useContext, useState, useEffect } from 'react';
import { Signer, utils } from 'ethers';

import { EthereumContext, MarketContext } from '@/contexts';
import { Weth__factory, Weth } from '@/types/contracts';
import { isEmpty } from '@/utils';

export const useWrapEth = () => {
  const { collateralData } = useContext(MarketContext);
  const { signer } = useContext(EthereumContext);

  const [wethContract, setWethContract] = useState<Weth>();

  useEffect(() => {
    if (!isEmpty(collateralData)) {
      const wethAddress = collateralData['WETH'].address;
      setWethContract(Weth__factory.connect(wethAddress, signer as Signer));
    }
  }, [signer, collateralData]);

  const wrapEth = async (ethAmount: number) => {
    const amount = utils.parseEther(ethAmount.toString());
    const tx = await wethContract?.deposit({ value: amount });
    return tx;
  };

  return wrapEth;
};

export default useWrapEth;
