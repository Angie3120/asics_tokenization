# Zionodes Token ETH

## Zionodes Tokenization Architecture
1. The user has the opportunity to buy an ASIC token, which is a representation of physical
equipment and can then use it as a tool for mining, through the mining functionality by staked
tokens, available on our website, to generate income.

2. Users purchase a token of ASIC directly through the project portal, using "buy" functionality -
available by using the following cryptocurrencies: USDT and USDС. When purchasing ASIC tokens
through the site, the contract receives information from the back-end and sends to the client's
address the appropriate (integer) number of tokens in ERC20 format. Price corresponding token
spelled out in the contract in USDT equivalent. Also, you can buy an ASIC token via Balancer pool
paired with renBTC.

3. Received ASICs tokens are sent to the staking pool, where they are distributed in pairs with
renBTC in the proportion of 98%/2% - this step is taken so that users who want to have it but do
not have the opportunity to buy an integer number of tokens, can buy a fractional part through the
pool. When staking, the customer receives a BPT token to his wallet address.

4. Received BPT tokens are staked on a mining contract to receive a mining reward.

5. The mining reward is formed due to the real mining process of physical ASIC and is converted to
renBTC. The contract automatically distributes the reward among the participants in proportion to
their share in the seeking.

6. The contract using [Ren Bridge](https://renproject.io/)* technology converts BTC to
[renBTC](https://etherscan.io/token/0xeb4c2781e4eba804ce9a9803c67d0893436bb27d) and reflects the
balance of available rewards, less maintenance, and electricity costs.

![plot](./photos/ZionodesTokenizationSchema.png)

*Ren bridge technology is an open protocol providing access to inter-blockchain liquidity for all
decentralized applications.

In our project, we use only the part connecting the Bitcoin and Ethereum blockchains. Wrapped in a
token in this way BTC becomes an ERC20 token renBTC, which corresponds to 1:1 BTC values. Thus, it
is possible to accrue rewards using our smart contracts on the Ethereum blockchain.
