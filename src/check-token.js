// Check ERC-20/TIP-20 token balance on Tempo
const { ethers } = require('ethers');
const config = require('./config');
const { loadWallet } = require('./wallet');

// Standard ERC-20 ABI (interface) - works for all ERC-20 tokens
const ERC20_ABI = [
  // Read-only functions
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
];

async function checkTokenBalance(tokenAddress) {
  console.log('🪙  Checking token balance...\n');
  
  try {
    // Connect to Tempo
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = loadWallet();
    
    console.log(`📬 Your Address: ${wallet.address}`);
    console.log(`🔗 Token Contract: ${tokenAddress}\n`);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Get token info
    const [name, symbol, decimals, balance] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.balanceOf(wallet.address),
    ]);
    
    // Format balance (convert from smallest unit to human-readable)
    const formattedBalance = ethers.formatUnits(balance, decimals);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Token Name: ${name}`);
    console.log(`🏷️  Token Symbol: ${symbol}`);
    console.log(`🔢 Decimals: ${decimals}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`💰 Your Balance: ${formattedBalance} ${symbol}`);
    console.log(`   (Raw: ${balance.toString()} smallest units)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (parseFloat(formattedBalance) === 0) {
      console.log('⚠️  You have 0 tokens!');
      console.log('\n📝 To get test tokens:');
      console.log('   1. Visit Tempo testnet faucet');
      console.log('   2. Request test tokens for this contract');
      console.log('   3. Run this script again\n');
    } else {
      console.log('✅ You have tokens! Ready to send.\n');
    }
    
  } catch (error) {
    console.error('❌ Error checking token balance:', error.message);
    console.log('\nPossible issues:');
    console.log('   - Invalid token contract address');
    console.log('   - Contract is not an ERC-20 token');
    console.log('   - Node connection issue\n');
  }
}

// CLI interface
if (require.main === module) {
  const tokenAddress = process.argv[2];
  
  if (!tokenAddress) {
    console.log('\n📖 Usage:\n');
    console.log('   node src/check-token.js <TOKEN_CONTRACT_ADDRESS>\n');
    console.log('Example:');
    console.log('   node src/check-token.js 0x1234567890abcdef1234567890abcdef12345678\n');
    console.log('Common Tempo Testnet Tokens:');
    console.log('   USDC: (searching for address...)\n');
    process.exit(1);
  }
  
  checkTokenBalance(tokenAddress);
}

module.exports = { checkTokenBalance };

