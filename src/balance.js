// Check balances for both wallets on Tempo
const { ethers } = require('ethers');
require('dotenv').config();

// Use public RPC for reliable, up-to-date data
const PUBLIC_RPC = 'https://rpc.testnet.tempo.xyz';

// Tempo testnet stablecoins
const TOKENS = {
  pathUSD: '0x20c0000000000000000000000000000000000000',
  AlphaUSD: '0x20c0000000000000000000000000000000000001',
  BetaUSD: '0x20c0000000000000000000000000000000000002',
  ThetaUSD: '0x20c0000000000000000000000000000000000003',
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

async function checkBalances(tokenAddress) {
  console.log('💰 Checking wallet balances...\n');
  
  try {
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
    
    // Load both wallets
    const walletAAddress = process.env.WALLET_A_ADDRESS;
    const walletBAddress = process.env.WALLET_B_ADDRESS;
    
    if (!walletAAddress || !walletBAddress) {
      console.error('❌ Wallet addresses not found in .env');
      console.log('Make sure WALLET_A_ADDRESS and WALLET_B_ADDRESS are set\n');
      process.exit(1);
    }
    
    // Get token info if token address provided
    let tokenName = 'N/A';
    let tokenSymbol = 'N/A';
    let tokenDecimals = 18;
    
    if (tokenAddress) {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      tokenName = await tokenContract.name();
      tokenSymbol = await tokenContract.symbol();
      tokenDecimals = await tokenContract.decimals();
    }
    
    console.log('🌐 Connected to: Tempo Testnet (Public RPC)');
    if (tokenAddress) {
      console.log(`🪙  Token: ${tokenName} (${tokenSymbol})`);
      console.log(`🔗 Contract: ${tokenAddress}`);
    }
    console.log('');
    
    // Check Wallet A
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📬 WALLET A');
    console.log(`   Address: ${walletAAddress}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const walletANative = await provider.getBalance(walletAAddress);
    console.log(`⚡ Native TEMPO: ${ethers.formatEther(walletANative)}`);
    
    if (tokenAddress) {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const walletAToken = await tokenContract.balanceOf(walletAAddress);
      const formattedBalance = ethers.formatUnits(walletAToken, tokenDecimals);
      console.log(`💰 ${tokenSymbol}: ${formattedBalance}`);
    }
    
    console.log('');
    
    // Check Wallet B
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📬 WALLET B');
    console.log(`   Address: ${walletBAddress}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const walletBNative = await provider.getBalance(walletBAddress);
    console.log(`⚡ Native TEMPO: ${ethers.formatEther(walletBNative)}`);
    
    if (tokenAddress) {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const walletBToken = await tokenContract.balanceOf(walletBAddress);
      const formattedBalance = ethers.formatUnits(walletBToken, tokenDecimals);
      console.log(`💰 ${tokenSymbol}: ${formattedBalance}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('❌ Error checking balances:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const tokenArg = process.argv[2];
  
  if (!tokenArg) {
    console.log('\n📖 Usage:\n');
    console.log('   node src/balance.js <TOKEN_ADDRESS_OR_NAME>\n');
    console.log('Available tokens:');
    console.log('   pathUSD   - ' + TOKENS.pathUSD);
    console.log('   AlphaUSD  - ' + TOKENS.AlphaUSD);
    console.log('   BetaUSD   - ' + TOKENS.BetaUSD);
    console.log('   ThetaUSD  - ' + TOKENS.ThetaUSD);
    console.log('\nExamples:');
    console.log('   node src/balance.js AlphaUSD');
    console.log('   node src/balance.js 0x20c0000000000000000000000000000000000001');
    console.log('\nTo check only native TEMPO (no token):');
    console.log('   node src/balance.js none\n');
    process.exit(1);
  }
  
  // Resolve token name to address
  let tokenAddress = null;
  if (tokenArg !== 'none') {
    tokenAddress = TOKENS[tokenArg] || tokenArg;
  }
  
  checkBalances(tokenAddress);
}

module.exports = { checkBalances, TOKENS };

