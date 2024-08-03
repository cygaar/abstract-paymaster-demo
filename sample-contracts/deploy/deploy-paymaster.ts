import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";
import dotenv from 'dotenv'; 
dotenv.config();  // Load environment variables from .env file 
 
export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Deploying the sample paymaster`);
 
  // Initialize the wallet.
  const wallet = new Wallet(process.env.PRIVATE_KEY!);
 
  // Create deployer object and load the artifact of the contract we want to deploy.
  const deployer = new Deployer(hre, wallet);
  // Load contract
  const artifact = await deployer.loadArtifact("SamplePaymaster");
 
  // Deploy this contract. The returned object will be of a `Contract` type,
  // similar to the ones in `ethers`.
  const paymasterContract = await deployer.deploy(artifact);
 
  // Show the contract info.
  console.log(`${artifact.contractName} was deployed to ${await paymasterContract.getAddress()}`);
}