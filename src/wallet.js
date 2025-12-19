// Generate and manage Tempo wallets
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createWallet() {
  console.log('🔐 Creating new Tempo wallet...\n');
  
  // Generate random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ Wallet generated!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📬 PUBLIC ADDRESS (share this to receive payments):');
  console.log(`   ${wallet.address}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 PRIVATE KEY (NEVER share this!):');
  console.log(`   ${wallet.privateKey}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('📝 What these mean:\n');
  console.log('   Address: Like your bank account number');
  console.log('            - Safe to share publicly');
  console.log('            - People send you money here');
  console.log('            - Starts with "0x" (42 characters)\n');
  
  console.log('   Private Key: Like your PIN code');
  console.log('            - NEVER share with anyone!');
  console.log('            - Controls access to your funds');
  console.log('            - If lost, funds are GONE forever');
  console.log('            - If stolen, thief can take all funds\n');
  
  // Ask if user wants to save to .env
  const answer = await question('💾 Save this wallet to .env file? (yes/no): ');
  
  if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
    saveToEnv(wallet.address, wallet.privateKey);
    console.log('\n✅ Wallet saved to .env file!');
    console.log('\n📋 Next steps:');
    console.log('   1. Get test USDC from faucet');
    console.log('   2. Check your balance: node src/balance.js');
    console.log('   3. Send your first payment: node src/send.js\n');
  } else {
    console.log('\n⚠️  Wallet NOT saved. Copy the keys above if you need them!\n');
  }
  
  rl.close();
}

function saveToEnv(address, privateKey) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Save as Wallet A by default
  if (envContent.includes('WALLET_A_PRIVATE_KEY=')) {
    console.log('\n⚠️  Wallet A already exists. Not overwriting.');
    console.log('   If you need multiple wallets, manually add to .env\n');
    return;
  }
  
  // Add Wallet A configuration
  envContent += `\n# Wallet A (Primary wallet)\n`;
  envContent += `WALLET_A_PRIVATE_KEY=${privateKey}\n`;
  envContent += `WALLET_A_ADDRESS=${address}\n`;
  
  fs.writeFileSync(envPath, envContent);
}

function loadWallet() {
  require('dotenv').config();
  
  // Use Wallet A (default sender wallet)
  const privateKey = process.env.WALLET_A_PRIVATE_KEY;
  
  if (!privateKey) {
    console.error('❌ No wallet found in .env file!');
    console.log('Make sure WALLET_A_PRIVATE_KEY is set in .env\n');
    process.exit(1);
  }
  
  return new ethers.Wallet(privateKey);
}

function showWallet() {
  const wallet = loadWallet();
  console.log('\n💼 Your Wallet:\n');
  console.log(`   Address: ${wallet.address}`);
  console.log(`   Private Key: ${wallet.privateKey.substring(0, 10)}...${wallet.privateKey.substring(wallet.privateKey.length - 8)}\n`);
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'create') {
    createWallet().catch(console.error);
  } else if (command === 'show') {
    showWallet();
  } else {
    console.log('\n📖 Wallet Commands:\n');
    console.log('   node src/wallet.js create   - Generate new wallet');
    console.log('   node src/wallet.js show     - Display existing wallet\n');
  }
}

module.exports = { createWallet, loadWallet, showWallet };

