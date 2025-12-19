// Send stablecoin payment on Tempo
const { ethers } = require('ethers');
require('dotenv').config();

// Use public RPC for reliable transaction broadcasting
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
  'function transfer(address to, uint256 amount) returns (bool)',
];

async function sendPayment(recipientAddress, amount, tokenAddress, senderWallet = 'A') {
  console.log('💸 Sending stablecoin payment...\n');
  
  try {
    // Connect to Tempo
    const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
    
    // Load sender wallet
    const senderPrivateKey = senderWallet === 'A' 
      ? process.env.WALLET_A_PRIVATE_KEY 
      : process.env.WALLET_B_PRIVATE_KEY;
    
    if (!senderPrivateKey) {
      console.error(`❌ Wallet ${senderWallet} private key not found in .env`);
      process.exit(1);
    }
    
    const wallet = new ethers.Wallet(senderPrivateKey, provider);
    
    // Get token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    // Get token info
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);
    
    // Convert amount to token units (considering decimals)
    const amountInUnits = ethers.parseUnits(amount.toString(), decimals);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TRANSACTION DETAILS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🪙  Token: ${name} (${symbol})`);
    console.log(`📤 From: ${wallet.address}`);
    console.log(`📥 To: ${recipientAddress}`);
    console.log(`💰 Amount: ${amount} ${symbol}`);
    console.log(`🔗 Network: Tempo Testnet`);
    console.log('');
    
    // Check sender balance (silently - only error if insufficient)
    const senderBalance = await tokenContract.balanceOf(wallet.address);
    const formattedBalance = ethers.formatUnits(senderBalance, decimals);
    
    if (senderBalance < amountInUnits) {
      console.error(`❌ Insufficient balance! You have ${formattedBalance} ${symbol} but trying to send ${amount} ${symbol}\n`);
      process.exit(1);
    }
    
    console.log('⏳ Sending transaction...');
    
    // Start timer for confirmation time measurement
    const startTime = Date.now();
    
    // Send transaction
    const tx = await tokenContract.transfer(recipientAddress, amountInUnits);
    
    console.log(`✅ Transaction submitted!`);
    console.log(`📝 Transaction Hash: ${tx.hash}`);
    console.log('');
    console.log('⏳ Waiting for confirmation...');
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    const endTime = Date.now();
    const confirmationTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TRANSACTION CONFIRMED!');
    console.log(`💰 ${amount} ${symbol} transferred successfully`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Transaction Hash: ${receipt.hash}`);
    console.log(`📦 Block Number: ${receipt.blockNumber}`);
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`⏱️  Confirmation Time: ${confirmationTime}s`);
    console.log(`✅ Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    console.log('🔗 View on Block Explorer:');
    console.log(`   https://explorer.testnet.tempo.xyz/tx/${receipt.hash}`);
    console.log('');
    
    // Performance analysis
    console.log('📊 PERFORMANCE ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`⏱️  Confirmation Time: ${confirmationTime}s`);
    console.log(`   ${confirmationTime < 1 ? '✅' : '⚠️ '} Tempo claims: <1 second finality`);
    console.log('');
    
    // Note: Gas cost calculation would require knowing gas price and native token value
    console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()} units`);
    console.log(`   (Gas fees paid in native TEMPO tokens)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎉 Payment completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Transaction failed:', error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.log('\n💡 This might mean:');
      console.log('   - Not enough native TEMPO tokens for gas fees');
      console.log('   - Not enough token balance\n');
    } else if (error.code === 'INVALID_ARGUMENT') {
      console.log('\n💡 Check that:');
      console.log('   - Recipient address is valid');
      console.log('   - Amount is a valid number\n');
    }
    
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const recipientArg = process.argv[2];
  const amountArg = process.argv[3];
  const tokenArg = process.argv[4] || 'AlphaUSD';
  const senderArg = process.argv[5] || 'A';
  
  if (!recipientArg || !amountArg) {
    console.log('\n📖 Usage:\n');
    console.log('   node src/send.js <RECIPIENT_ADDRESS> <AMOUNT> [TOKEN] [SENDER_WALLET]\n');
    console.log('Arguments:');
    console.log('   RECIPIENT_ADDRESS  - Wallet address to send to');
    console.log('   AMOUNT            - Amount to send (e.g., 100)');
    console.log('   TOKEN             - Token name or address (default: AlphaUSD)');
    console.log('   SENDER_WALLET     - A or B (default: A)');
    console.log('');
    console.log('Available tokens:');
    console.log('   pathUSD   - ' + TOKENS.pathUSD);
    console.log('   AlphaUSD  - ' + TOKENS.AlphaUSD);
    console.log('   BetaUSD   - ' + TOKENS.BetaUSD);
    console.log('   ThetaUSD  - ' + TOKENS.ThetaUSD);
    console.log('');
    console.log('Examples:');
    console.log('   # Send 100 AlphaUSD from Wallet A to Wallet B');
    console.log('   node src/send.js $WALLET_B_ADDRESS 100 AlphaUSD A');
    console.log('');
    console.log('   # Using environment variable for Wallet B address');
    console.log('   node src/send.js ' + (process.env.WALLET_B_ADDRESS || '0x...') + ' 100 AlphaUSD');
    console.log('');
    console.log('   # Send pathUSD');
    console.log('   node src/send.js ' + (process.env.WALLET_B_ADDRESS || '0x...') + ' 50 pathUSD');
    console.log('');
    console.log('   # Using full contract address');
    console.log('   node src/send.js ' + (process.env.WALLET_B_ADDRESS || '0x...') + ' 100 0x20c0000000000000000000000000000000000001');
    console.log('');
    process.exit(1);
  }
  
  // Resolve token name to address
  const tokenAddress = TOKENS[tokenArg] || tokenArg;
  
  sendPayment(recipientArg, amountArg, tokenAddress, senderArg);
}

module.exports = { sendPayment, TOKENS };

