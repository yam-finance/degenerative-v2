# Yam Synths Website

#### Development

- General Notes:
  - Utilization is used internally, which is 1/collateral ratio. However, Collateral ratio is shown on to the user.

Generating Typechain classes:
Typechain classes must be generated in order to run. To do so, either run `yarn prebuild` or `yarn build`.

https://v2.degenerative.finance/ - V2 website
<a href="https://app.netlify.com/sites/sharp-payne-4efcb1/deploys" target="_blank">![Netlify Status](https://api.netlify.com/api/v1/badges/f75649ac-4d62-46db-adaa-1b073b0ad019/deploy-status)</a>

https://v2develop.degenerative.finance/ - Development builds
<a href="https://app.netlify.com/sites/suspicious-swartz-42cd93/deploys" target="_blank">![Netlify Status](https://api.netlify.com/api/v1/badges/c205b32a-41de-4570-8e8d-7d1637be2caf/deploy-status)</a>

#### Testing

For manual testing on forked mainnet, follow these steps:

1. `git clone` this repository
2. run `yarn` to install all dependencies
3. In a second terminal, run `yarn fork` to active the Hardhat forked mainnet
4. Read the output and find one of the test accounts listed by Hardhat.
5. In your browser's Metamask, connect to the local chain at `localhost:8545`
6. In Metamask, import the private key of the account found in step 4
7. You are ready to test with 10,000 ETH in your wallet

- Dev Notes:
  - Be mindful to reset your wallet after running an instance of the forked chain
