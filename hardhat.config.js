/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers: [
      {
        version: '0.7.3',
      },
      {
        version: '0.6.2',
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: 'https://fee7372b6e224441b747bf1fde15b2bd.eth.rpc.rivet.cloud',
      },
      chainId: 1337,
    },
  },
};
