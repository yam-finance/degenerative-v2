import { useContext, useState, useCallback, useEffect } from 'react';
import { Signer, utils, constants } from 'ethers';

import { EthereumContext } from '@/contexts/EthereumContext';
import { Weth__factory, Weth } from '@/types/contracts';

import { WETH as wethAddress } from '@/constants/addresses';

export const useWeth = () => {
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

  return {
    wrapEth,
  };
};

export default useWeth;
