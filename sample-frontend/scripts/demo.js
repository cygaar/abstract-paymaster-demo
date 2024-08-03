const { createWalletClient, defineChain, http, encodeFunctionData } = require('viem');
const { privateKeyToAccount, generatePrivateKey } = require('viem/accounts');
const { eip712WalletActions, getGeneralPaymasterInput, chainConfig } = require('viem/zksync');

(async () => {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey)

  const abstract = defineChain({
    ...chainConfig,
    id: 11124,
    name: 'Abstract Testnet',
    network: 'abstract-testnet',
    nativeCurrency: {
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: {
        http: ['https://api.testnet.abs.xyz'],
      },
    },
    testnet: true,
  });

  const walletClient = createWalletClient({
    account,
    chain: abstract, 
    transport: http(), 
  }).extend(eip712WalletActions())

  const nftAddress = "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA";
  const contractABI = require("../../sample-contracts/artifacts-zk/contracts/SampleNFT.sol/SampleNFT.json").abi;

  const paymasterInput = getGeneralPaymasterInput({
    innerInput: '0x',
  })
  
  const hash = await walletClient.sendTransaction({
    account: account,
    data: encodeFunctionData({abi: contractABI, functionName: "mint", args: [account.address, 1]}),
    to: nftAddress,
    value: 0,
    paymaster: '0xa8dA6C5bf7dA8c2D5A642D3dcc0E04D68D134806',
    paymasterInput: paymasterInput
  })

  console.log(hash);
})();

