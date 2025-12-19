// Load environment variables
require('dotenv').config();

// Tempo Testnet Configuration
const config = {
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545',
  chainId: parseInt(process.env.CHAIN_ID) || 42429,
  chainName: 'Tempo Testnet',
  
  // Block explorer (if available)
  explorerUrl: 'https://explorer.testnet.tempo.xyz',
  
  // Faucet (if available)
  faucetUrl: 'https://faucet.testnet.tempo.xyz',
};

module.exports = config;

