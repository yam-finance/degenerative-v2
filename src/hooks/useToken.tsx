import { useCallback, useContext } from 'react';

import { constants, Signer, utils } from 'ethers';
import { EthereumContext } from '@/contexts';
import { Erc20__factory } from '@/types/contracts';

export const useToken = () => {
  const { signer, account } = useContext(EthereumContext) ?? {};

  //const [tokenContract, setTokenContract] = useState<Erc20>(Erc20__factory.connect(tokenAddress, signer as Signer));

  //useEffect(() => {
  //  setTokenContract(Erc20__factory.connect(tokenAddress, signer as Signer));
  //}, [signer, tokenAddress]);

  const approveSpender = useCallback(
    async (tokenAddress: string, spenderAddress: string, tokenAmount?: string) => {
      if (signer) {
        const tokenContract = Erc20__factory.connect(tokenAddress, signer as Signer);
        const amount = tokenAmount ? utils.parseEther(tokenAmount) : constants.MaxUint256;
        const gasLimit = await tokenContract.estimateGas.approve(spenderAddress, amount);
        return await tokenContract.approve(spenderAddress, amount, {
          gasLimit: gasLimit,
        });
      }
    },
    [signer]
  );

  const getAllowance = useCallback(
    async (tokenAddress: string, spenderAddress: string) => {
      if (account && signer) {
        const tokenContract = Erc20__factory.connect(tokenAddress, signer as Signer);
        //return (await tokenContract.allowance(account as string, spenderAddress)).toString();
        const allowance = (await tokenContract.allowance(account as string, spenderAddress)).gt(0);
        console.log(allowance);
        return allowance;
      } else {
        return Promise.reject('No account or signer');
      }
    },
    [signer, account]
  );

  const getBalance = useCallback(
    async (tokenAddress: string) => {
      if (account && signer) {
        const tokenContract = Erc20__factory.connect(tokenAddress, signer);
        return await tokenContract.balanceOf(account);
      } else {
        return Promise.reject('No account or signer');
      }
    },
    [signer, account]
  );

  return {
    getAllowance,
    approveSpender,
    getBalance,
  };
};
