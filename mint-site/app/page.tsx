'use client';

import React, { useState, useEffect } from 'react';
import { createWalletClient, custom, encodeFunctionData, Hash, Address, defineChain, Chain, createPublicClient, http } from 'viem';
import { eip712WalletActions, getGeneralPaymasterInput, chainConfig } from 'viem/zksync';
import contractABI from './abi/SampleNFT.json';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const NFT_CONTRACT_ADDRESS = "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA";
const PAYMASTER_ADDRESS = "0xa8dA6C5bf7dA8c2D5A642D3dcc0E04D68D134806";

// This chain config will be added to a future version of viem
// https://github.com/wevm/viem/pull/2581
const abstract: Chain = defineChain({
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

const publicClient = createPublicClient({
  chain: abstract,
  transport: http()
});

export default function Home() {
  const [account, setAccount] = useState<Address | null>(null);
  const [walletClient, setWalletClient] = useState<any>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [transactionHash, setTransactionHash] = useState<Hash | null>(null);

  const checkNetwork = async () => {
    if (window.ethereum) {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const correct = parseInt(chainId) === abstract.id;
      setIsCorrectNetwork(correct);
      return correct;
    }
    return false;
  };

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${abstract.id.toString(16)}` }],
        });
        return await checkNetwork();
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: `0x${abstract.id.toString(16)}`,
                  chainName: abstract.name,
                  nativeCurrency: abstract.nativeCurrency,
                  rpcUrls: [abstract.rpcUrls.default.http[0]],
                },
              ],
            });
            return await checkNetwork();
          } catch (addError) {
            console.error('Failed to add the network:', addError);
          }
        } else {
          console.error('Failed to switch network:', switchError);
        }
      }
    }
    return false;
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const client = createWalletClient({
        chain: abstract,
        transport: custom(window.ethereum)
      }).extend(eip712WalletActions());
      setWalletClient(client);
      
      window.ethereum.request({ method: 'eth_requestAccounts' })
        .then((accounts: string[]) => {
          setAccount(accounts[0] as Address);
          checkNetwork();
        })
        .catch((error: any) => {
          console.error("User denied account access", error);
        });

      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] as Address);
        checkNetwork();
      });

      window.ethereum.on('chainChanged', () => {
        checkNetwork();
      });
    }
  }, []);

  const handleClick = async () => {
    if (!walletClient || !account) {
      alert('Please connect your wallet first');
      return;
    }

    if (isTransactionPending) return;

    let networkCorrect = await checkNetwork();
    if (!networkCorrect) {
      networkCorrect = await switchNetwork();
      if (!networkCorrect) {
        alert('Please switch to the Abstract Testnet to mint.');
        return;
      }
    }


    try {
      setIsTransactionPending(true);
      setTransactionHash(null);
      const paymasterInput = getGeneralPaymasterInput({
        innerInput: '0x',
      });
      const nonce = await publicClient.getTransactionCount({
        address: account
      });
      const hash: Hash = await walletClient.sendTransaction({
        account,
        to: NFT_CONTRACT_ADDRESS,
        data: encodeFunctionData({
          abi: contractABI.abi,
          functionName: "mint",
          args: [account, 1]
        }),
        paymaster: PAYMASTER_ADDRESS,
        paymasterInput: paymasterInput,
        nonce: nonce
      });

      console.log("Transaction hash:", hash);
      setTransactionHash(hash);
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsTransactionPending(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
      <h1 style={styles.title}>Abstract Sponsored Transaction Demo</h1>
        {account ? (
          <p style={styles.accountText}>Connected Account: {account}</p>
        ) : (
          <p style={styles.accountText}>No account connected</p>
        )}
        {!isCorrectNetwork && <p style={styles.warningText}>Please switch to the Abstract Testnet</p>}
        <button 
          style={
            !isCorrectNetwork
              ? styles.blueButton
              : isTransactionPending
              ? {...styles.button, ...styles.disabledButton}
              : styles.button
          } 
          onClick={!isCorrectNetwork ? switchNetwork : handleClick}
          disabled={isTransactionPending}
        >
          {!isCorrectNetwork
            ? 'Change network to Abstract Testnet'
            : isTransactionPending
            ? 'Waiting...'
            : 'Mint NFT'}
        </button>
        {transactionHash && (
          <div style={styles.transactionInfo}>
            <p style={styles.transactionText}>Minted with no gas fees!</p>
            <a 
              href={`https://explorer.testnet.abs.xyz/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.link}
            >
              View on Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f0f0',
    fontFamily: 'Arial, sans-serif',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    color: '#333',
    marginBottom: '1.5rem',
    fontWeight: 'bold', // This makes the title bold
    fontSize: '24px', 
  },
  accountText: {
    color: '#666',
    marginBottom: '1rem',
    wordBreak: 'break-all' as const,
  },
  warningText: {
    color: 'red',
    marginBottom: '1rem',
  },
  transactionInfo: {
    color: 'blue',
    marginTop: '1rem',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  transactionText: {
    marginBottom: '0.5rem', // This adds space between the text and the link
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
    padding: '0.5rem 1rem', // This adds padding around the link text
    border: '1px solid #4CAF50',
    borderRadius: '4px',
    transition: 'background-color 0.3s, color 0.3s',
  },
  button: {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
  blueButton: {
    backgroundColor: '#007bff',
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    color: '#666666',
    cursor: 'not-allowed',
  },
};