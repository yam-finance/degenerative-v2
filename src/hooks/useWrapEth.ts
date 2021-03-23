import { useContext, useState, useEffect } from 'react';
import { Signer, utils } from 'ethers';

import { EthereumContext } from '@/contexts';
import { Weth__factory, Weth } from '@/types/contracts';

import { CollateralMap } from '@/utils/TokenList';

export const useWrapEth = () => {
  const wethAddress = CollateralMap['WETH'].address;
  const { signer } = useContext(EthereumContext);

  const [wethContract, setWethContract] = useState<Weth>(Weth__factory.connect(wethAddress, signer as Signer));

  useEffect(() => {
    setWethContract(Weth__factory.connect(wethAddress, signer as Signer));
  }, [signer, wethAddress]);

  const wrapEth = async (ethAmount: number) => {
    const amount = utils.parseEther(ethAmount.toString());
    const tx = await wethContract.deposit({ value: amount });
    return tx;
  };

  return wrapEth;
};

export default useWrapEth;
