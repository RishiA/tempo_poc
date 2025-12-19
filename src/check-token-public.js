// Check token balance using PUBLIC Tempo testnet RPC
const { ethers } = require('ethers');
const { loadWallet } = require('./wallet');

// Use PUBLIC Tempo testnet RPC
const PUBLIC_RPC = 'https://rpc.testnet.tempo.xyz';

// Standard ERC-20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

async function checkTokenBalance(tokenAddress) {
  console.log('🪙  Checking token balance on PUBLIC testnet...\n');
  
  try {
    // Connect to PUBLIC Tempo testnet (not local node!)
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
    const wallet = loadWallet();
    
    console.log(`📬 Your Address: ${wallet.address}`);
    console.log(`🔗 Token Contract: ${tokenAddress}`);
    console.log(`🌐 RPC: ${PUBLIC_RPC}\n`);
    
    // Create contract instance
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    // Get token info
    const [name, symbol, decimals, balance] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
      tokenContract.balanceOf(wallet.address),
    ]);
    
    // Format balance
    const formattedBalance = ethers.formatUnits(balance, decimals);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Token Name: ${name}`);
    console.log(`🏷️  Token Symbol: ${symbol}`);
    console.log(`🔢 Decimals: ${decimals}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`💰 Your Balance: ${formattedBalance} ${symbol}`);
    console.log(`   (Raw: ${balance.toString()} smallest units)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (parseFloat(formattedBalance) === 0) {
      console.log('⚠️  Still 0 tokens on public testnet.');
      console.log('   Transaction might still be processing...\n');
    } else {
      console.log('✅ Tokens found! Ready to send payments.\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// CLI interface
if (require.main === module) {
  const tokenAddress = process.argv[2] || '0x20c0000000000000000000000000000000000000';
  
  console.log('🔍 This script checks the PUBLIC Tempo testnet');
  console.log('   (Not your local node)\n');
  
  checkTokenBalance(tokenAddress);
}

module.exports = { checkTokenBalance };

