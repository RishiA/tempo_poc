// Test connection to Tempo node
const { ethers } = require('ethers');
const config = require('./config');

async function testConnection() {
  console.log('🔗 Connecting to Tempo Testnet...\n');
  
  try {
    // Create provider (connection to node)
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`✅ Connected to: ${config.chainName}`);
    console.log(`   Chain ID: ${network.chainId.toString()}`);
    
    // Get current block number
    const blockNumber = await provider.getBlockNumber();
    console.log(`   Current Block: ${blockNumber.toLocaleString()}`);
    
    // Get latest block details
    const block = await provider.getBlock('latest');
    const blockTime = new Date(Number(block.timestamp) * 1000);
    console.log(`   Latest Block Time: ${blockTime.toLocaleString()}`);
    
    // Check if syncing
    const isSyncing = await provider.send('eth_syncing', []);
    if (isSyncing) {
      console.log(`\n⏳ Node is syncing...`);
      console.log(`   Current: ${parseInt(isSyncing.currentBlock)}`);
      console.log(`   Highest: ${parseInt(isSyncing.highestBlock)}`);
      const progress = (parseInt(isSyncing.currentBlock) / parseInt(isSyncing.highestBlock) * 100).toFixed(2);
      console.log(`   Progress: ${progress}%`);
    } else {
      console.log(`\n✅ Node is fully synced!`);
    }
    
    console.log(`\n🎉 Connection test successful!`);
    console.log(`\nYou can now interact with Tempo blockchain at:`);
    console.log(`   ${config.rpcUrl}\n`);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure Tempo node is running: tempo node --follow --http');
    console.log('2. Check that RPC_URL in .env is correct');
    console.log('3. Verify port 8545 is not blocked\n');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  testConnection();
}

module.exports = { testConnection };

