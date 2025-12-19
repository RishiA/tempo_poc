# Learning Tempo - Building a Stablecoin Payment PoC

## Goal

**Primary**: Learn how blockchain payments work on Tempo through hands-on building  
**Secondary**: Evaluate if Rho Banking should integrate similar stablecoin payment capabilities

**Context**: Ramp and Mercury (Rho's competitors) are Tempo design partners. I'm joining Rho as payments & data platform lead and need to understand this competitive landscape.

---

## What is Tempo?

Tempo is a Layer 1 blockchain purpose-built for payments:
- **Built by**: Stripe + Paradigm incubation
- **Focus**: Stablecoin payments (USDC, etc.)
- **Key differentiator**: Pay gas fees in stablecoins (not volatile tokens like ETH)
- **Performance**: 100k+ TPS, sub-second finality
- **Cost**: $0.001 fixed fee per transaction
- **Compatibility**: EVM-compatible (uses Ethereum tooling)

---

## My Setup

### System
- **OS**: macOS 24.5.0
- **Node.js**: v23.11.0 ✅
- **npm**: v10.9.2 ✅
- **Git**: v2.49.0 ✅
- **Editor**: Cursor IDE ✅
- **GitHub**: github.com/rishia

### Tempo Installation
- **Tempo CLI**: v0.7.3 ✅
- **Location**: `/Users/rishi/.tempo/bin/tempo`
- **Build**: Commit 3961312d (Dec 8, 2025)

---

## What I've Done So Far

### Step 1: Installed Tempo CLI
```bash
curl -L https://tempo.xyz/install | bash
```
- This installed the Tempo node software
- Created binary at `~/.tempo/bin/tempo`
- Added to PATH automatically

### Step 2: Downloaded Testnet Data
```bash
tempo download
```
- Downloaded blockchain snapshot/data for testnet
- This speeds up initial sync (don't need to sync from genesis)

### Step 3: Started Testnet Node
```bash
tempo node --follow --http
```
- Started a Tempo node that follows the testnet
- `--http` flag enables the RPC server (required for API access!)
- Node is syncing with the network
- This gives me a local RPC endpoint to interact with

**What this means**: I can now interact with Tempo testnet through my local node at `http://localhost:8545` (standard Ethereum RPC port)

**Important**: Without `--http` flag, the node runs but doesn't expose an API endpoint

---

## Understanding What We Just Did

### What is `tempo node --follow --http`?

#### `tempo node`
**What it does**: Starts the Tempo blockchain node software on your computer

**Think of a blockchain node as**:
- A database server that stores the entire blockchain
- A validator that processes transactions
- An API server that lets apps interact with the blockchain

**In traditional terms**: Like running your own PostgreSQL database + API server, but for blockchain.

#### `--follow`
**What it does**: Tells your node to "follow" (sync with) the Tempo testnet

**Two modes**:

**Without `--follow`** (standalone):
- Creates a brand new, empty blockchain on your machine
- You're the only node
- Useful for: isolated testing
- Problem: Can't interact with real testnet, no test tokens

**With `--follow`** (what we're using):
- Connects to Tempo's testnet network
- Downloads all blocks from other nodes
- Stays synchronized with the network
- Useful for: testing with real testnet, getting tokens from faucet

**Analogy**: 
- Without `--follow`: Private Slack workspace (just you)
- With `--follow`: Join existing Slack workspace (community testnet)

#### `--http` (Critical!)
**What it does**: Enables the HTTP RPC (Remote Procedure Call) server

**Without `--http`**:
```
Your Node: [Running, syncing blocks]
Your Scripts: "Hey, can I send a transaction?"
Your Node: [No response - no API endpoint]
```

**With `--http`**:
```
Your Node: [Running, syncing blocks]
           [HTTP API listening on localhost:8545]
Your Scripts: "Hey, send 10 USDC to Alice"
Your Node: "Got it! Transaction hash: 0x123..."
```

**Why is it disabled by default?**
- Security: Exposing APIs can be risky
- Resource usage: API server uses CPU/memory
- Some users only want to sync data, not serve requests

### What's Happening Right Now?

My node is doing three things simultaneously:

#### 1. Syncing the Blockchain
```
Headers: Block 4,755,378  ← Latest block on network
Bodies:  Block 4,620,021  ← Downloading transaction data
Execution: Block 4,554,157 ← Processing/validating blocks
```

**Analogy**: Like downloading a massive Git repository:
- Headers = commit SHAs (fast to download)
- Bodies = file contents (slower)
- Execution = verifying signatures (slowest, CPU-intensive)

#### 2. Connecting to Peers (P2P Network)
- Node discovered other Tempo testnet nodes
- Downloading blocks via P2P (like BitTorrent)
- Sharing data with other nodes

#### 3. Serving RPC Requests
```
RPC HTTP server started url=127.0.0.1:8545
```
- Accepting API requests from my machine
- `127.0.0.1` = localhost (only my computer can access)
- Port `8545` = standard Ethereum/EVM RPC port

### How My JavaScript Will Use This

**The chain of communication**:
```
My JavaScript Code (send.js)
        ↓
Uses ethers.js library
        ↓
HTTP request to localhost:8545
        ↓
My Tempo Node receives request
        ↓
Signs & broadcasts transaction
        ↓
Network confirms transaction
        ↓
Script gets confirmation
```

### Alternative Approaches

**Option 1: Local Node** (what I chose) ✅
- Pros: Full control, privacy, learn infrastructure
- Cons: Disk space, needs to sync, bandwidth

**Option 2: Public RPC** (easier but less educational)
```javascript
const RPC_URL = "https://rpc.testnet.tempo.xyz"
```
- Pros: No setup, always synced
- Cons: Depends on external service, rate limits

**Option 3: Local Dev Chain** (if supported)
```bash
tempo node --dev --http
```
- Pros: Instant, pre-funded accounts
- Cons: Not real testnet

### Key Insight for Rho Evaluation

**I just set up blockchain infrastructure!** This is what Rho would need to decide:
- Run own nodes (more control, more ops)
- Use hosted RPC services (easier, less control)
- Hybrid approach

Understanding the trade-offs firsthand is valuable.

---

## Learning Plan

### Phase 1: Foundation - Testnet & CLI (In Progress)
- [x] Install Tempo CLI
- [x] Start testnet node with HTTP RPC
- [x] Node fully synced (block 4,762,118)
- [x] Create Node.js project
- [x] Install dependencies (ethers.js, dotenv)
- [x] Test connection to node
- [ ] Create test wallets
- [ ] Get test USDC from faucet
- [ ] Send first payment
- [ ] Check balance & transaction history
- [ ] Understand fee mechanics

### Phase 2: Local Development Node (Optional)
- [ ] Run fully local node (not following testnet)
- [ ] Understand node infrastructure
- [ ] Learn about network configuration

### Phase 3: Web Interface
- [ ] Build simple HTML/JS dashboard
- [ ] Create payment form
- [ ] Show balance & transaction history
- [ ] Add real-time notifications

### Phase 4: Business Evaluation for Rho
- [ ] Map use cases: vendor payments, treasury, payroll
- [ ] Cost/benefit analysis vs traditional banking
- [ ] Competitive analysis vs Ramp/Mercury
- [ ] Integration effort estimate
- [ ] Create recommendation: Build / Partner / Wait

---

## Key Concepts to Learn

### Blockchain Basics
- **Wallet**: Public address (shareable) + Private key (secret)
- **Transaction**: Signed instruction to move funds
- **Gas**: Fee paid to process transaction
- **RPC**: API endpoint to interact with blockchain
- **Finality**: When transaction is confirmed and irreversible

### Tempo-Specific
- **Stablecoin-native gas**: Pay fees in USDC, not native token
- **Payment lanes**: Dedicated throughput for payments
- **TIP-20 tokens**: Tempo's stablecoin standard
- **Memo fields**: Transaction metadata for reconciliation

---

## Questions to Answer

### Technical
- [ ] How does signing a transaction work?
- [ ] What's the transaction lifecycle (broadcast → mempool → confirmed)?
- [ ] How do you attach memos/metadata to payments?
- [ ] What's the difference between Tempo and Ethereum?
- [ ] How hard is it to integrate Tempo into an app?

### Business (for Rho)
- [ ] What use cases make sense for Rho customers?
- [ ] What's the cost savings vs ACH/Wire?
- [ ] What's the UX improvement vs traditional payments?
- [ ] What are the regulatory requirements?
- [ ] How big is the competitive gap vs Ramp/Mercury?
- [ ] Should Rho build this? Partner? Wait?

---

## Notes & Observations

**Discovery**: Already had Tempo CLI installed!
- Found it at `~/.tempo/bin/tempo`
- Version 0.7.3, built Dec 8, 2025
- Much easier setup than expected (no Docker needed)

**Node Status**:
- Started with `tempo node --follow --http` ✅
- RPC endpoint: `http://localhost:8545` ✅
- Chain ID: 42429 (Tempo Testnet) ✅
- Current block: 4,554,157 (syncing, ~96% complete) ⏳
- Can start building now while it finishes syncing!

**Next Steps**:
1. ✅ Node is running with HTTP RPC enabled
2. ✅ Confirmed connection and chain ID
3. → Create Node.js project
4. → Create test wallets
5. → Get test USDC from faucet
6. → Send first payment!

---

## Resources

### Official
- Website: https://tempo.xyz
- Docs: https://docs.tempo.xyz
- GitHub: https://github.com/tempoxyz
- Block Explorer: https://explorer.tempo.xyz (need to verify)
- Faucet: https://faucet.tempo.xyz (need to verify)

### My Research
- [Use case analysis](./Tempo testnet - use cases.md) - Competitive research on Ramp/Mercury

### Learning Resources
- Ethers.js: https://docs.ethers.org (JavaScript library for blockchain)
- Ethereum basics: https://ethereum.org/en/developers/docs/

---

## Learnings

### Project Setup Complete

**What I built**:
- ✅ Node.js project in `/Users/rishi/Documents/GitHub/tempo`
- ✅ Installed `ethers.js` v6 (standard library for EVM chains)
- ✅ Installed `dotenv` (secure environment variable management)
- ✅ Created configuration files
- ✅ Built connection test script

**What I learned**:
- **ethers.js**: Industry-standard JavaScript library for blockchain interaction
- **JSON-RPC**: How applications communicate with blockchain nodes
- **Provider pattern**: `JsonRpcProvider` wraps HTTP connection to node
- **Async/await**: All blockchain calls are asynchronous (network requests)

**First successful connection**:
```bash
node src/connect.js
# Output: Connected to Chain ID 42429, block 4,762,118
```

**Key insight**: Interacting with blockchain is just HTTP requests! The node exposes JSON-RPC API at localhost:8545, and ethers.js makes it easy to use.

**Next**: Create wallets and get test USDC from faucet.

### Wallet Created & Funded

**What I built**:
- ✅ Wallet generation script (`src/wallet.js`)
- ✅ Balance checker script (`src/balance.js`)
- ✅ Created my first wallet

**My wallet**:
- Address: `0x9bFc636780A6135EFEF7614D782E8Cb39d65Add3`
- Balance: 4.2 * 10^45 TEMPO tokens (auto-funded by testnet!)

**What I learned**:
- **Wallet = Address + Private Key**
  - Address: Public, shareable (like bank account number)
  - Private Key: Secret, never share (like PIN code)
- **Cryptographic key pairs**: 
  - Private key is 256-bit random number
  - Public address is derived from private key (one-way)
  - Can't reverse engineer private key from address
- **Testnet auto-funding**: Tempo testnet automatically gives new wallets native tokens
- **ethers.Wallet.createRandom()**: Uses cryptographically secure randomness
- **Native tokens vs Stablecoins**:
  - TEMPO: Native token for gas fees
  - USDC/stablecoins: Separate ERC-20 tokens (need to check separately)

**Key insight**: Wallets are just math! No registration, no server. Generate keys = you have a wallet. This is why private keys are so critical - there's no "forgot password" button.

**Next**: Send first payment to test transaction flow.

---

### Understanding Check: Wallet & Balance Concepts

**Q1: What's the difference between wallet address and private key?**

**My Answer**:
- Wallet address is public so I can share it with others to pay them or get paid. It's like my unique identifier. 
- My private key is like the password - to both access my wallet securely (only by me), and for me to authenticate against it via API, so only I can build against it.

**✅ Mostly Correct! Clarification**:

**Wallet Address**:
- ✅ Public, shareable
- ✅ Your unique identifier  
- ✅ **Others send TO you** at this address
- ⚠️ **You DON'T need this to pay others** - you use your private key

**Private Key**:
- ✅ Like a password - NEVER share
- ✅ Used to authenticate/sign transactions
- ✅ Only you can build against it
- ✅ **This is what you use to SEND payments**

**Better Analogy**:
- **Address** = Your email address (people send TO it)
- **Private Key** = Your email password (you use it to SEND emails)

---

**Q2: What is the native TEMPO balance we just checked?**

**My Answer**:
- Native tempo balance is just fake test money. Analogous to test credit card like 4111 1111 1111 1111. 
- It is not Stablecoin balance yet because we have yet to make a USDC test transaction. 
- It does however mean that my wallet is setup for testing. 
- This is what I will use to pay for gas when doing transactions. 
- So if I want to send a test transaction for 100 USDC, then the gas will be deducted from my current Tempo balance on my wallet.

**✅ Mostly Correct! Clarifications**:

**Part A: Test Money** ✅
- ✅ Yes, fake test money (like 4111 1111 1111 1111 test card)
- ✅ Only works on testnet
- ✅ Your wallet is set up for testing

**Part B: Stablecoins** ⚠️ (important correction)

My statement: "It is not Stablecoin balance yet coz we have yet to make a USDC test transaction"

**Correction**: 
- Stablecoins are **separate tokens** on the blockchain
- You DON'T create them by making transactions
- You need to **receive** USDC tokens from someone (or a faucet)
- Think of it like: TEMPO is like dollars, USDC is like airline miles - completely separate

**Better Mental Model**:
```
My Wallet = A physical wallet

Inside my wallet I can have:
- 💵 Cash (TEMPO tokens) - I have tons of this ✅
- 🎫 Gift cards (USDC tokens) - I have ZERO of these ❌
- 🎟️ Other tokens - I have ZERO of these ❌
```

You can check if you have USDC by querying the USDC contract: "How much USDC does my address own?"

**Part C: Gas Fees** ✅ (perfectly understood!)

My statement: "So if I want to send a test transaction for 100 USDC, then the gas will be deducted from my current Tempo balance"

**✅ 100% CORRECT!**

**Example Transaction Flow**:
```
I want to: Send 100 USDC to Alice

What happens:
1. My USDC balance: 100 → 0 (I sent it)
2. My TEMPO balance: 4.2*10^45 → 4.2*10^45 - 0.001 (gas paid)
3. Alice's USDC balance: 0 → 100 (she received it)

Two separate balances affected!
```

---

**🎯 Key Insight I Nailed**:

I understand the critical concept: 
- **TEMPO** = Currency for gas (like ETH on Ethereum)
- **USDC** = Stablecoin token I actually want to send
- Gas is ALWAYS paid in native token, NEVER in the token you're sending

**Why This Matters for Rho**:

This is **THE** concept that Tempo improves on traditional blockchains:
- **Ethereum**: Need ETH for gas (volatile, confusing for users)
- **Tempo**: Can pay gas in stablecoins (easier UX) ← This is their innovation
- **Current Testing**: Even on Tempo testnet, we're using native TEMPO for gas

**Business Implication**: 
For Rho customers, paying gas in USDC means:
- No need to buy/hold volatile tokens
- Simpler accounting (all costs in stablecoins)
- Better UX (users don't need to understand "gas tokens")

---

**Understanding: Reading vs Writing Blockchain**

**What we just did** (`balance.js`):
- ✅ **Reading**: FREE - no gas needed
- ✅ Just queries data from blockchain
- ✅ Anyone can check any address's balance
- ✅ No private key needed to READ

**What we'll do next** (sending transactions):
- 💸 **Writing**: Costs gas fees
- 💸 Sends a transaction to blockchain
- 💸 Requires private key to SIGN transaction
- 💸 Changes blockchain state (permanent!)

---

### Token Balance Checking & Faucet

**What I built**:
- ✅ Generic ERC-20 token checker (`src/check-token.js`)
- ✅ Public RPC token checker (`src/check-token-public.js`)

**Discovered: Tempo's Test Stablecoins**

Tempo testnet has **4 different test stablecoins** (all precompiled contracts):

```
pathUSD:   0x20c0000000000000000000000000000000000000  (ends in ...0000)
AlphaUSD:  0x20c0000000000000000000000000000000000001  (ends in ...0001)
BetaUSD:   0x20c0000000000000000000000000000000000002  (ends in ...0002)
ThetaUSD:  0x20c0000000000000000000000000000000000003  (ends in ...0003)
```

**Special Pattern**: Notice all the zeros? These are "precompiled" contracts - built directly into Tempo blockchain (not deployed like normal contracts). This shows these stablecoins are first-class citizens on Tempo, optimized for performance.

**Got Test Tokens from Faucet**:
- Used Tempo web faucet: https://docs.tempo.xyz/quickstart/faucet
- Transaction hash: `0x92b9397f255dfd475863e84fb2ff1fe7b285cc3755ee68a971070981fcbd35c1`
- Block: 4,802,263
- Received: 2,000,000 AlphaUSD tokens! 🎉
- Transaction fee: 0.000821 AlphaUSD (paid in stablecoin!)

**Final Balance**:
```
💰 AlphaUSD: 2,000,000.0 (2 trillion smallest units)
📝 Token Name: AlphaUSD (Tempo's testnet stablecoin)
🔢 Decimals: 6 (same as real USDC)
```

---

### Critical Learning: Local Node vs Public RPC

**The Problem I Hit**:

1. ✅ Got tokens from faucet (transaction succeeded on public testnet)
2. ❌ Checked balance using my local node → showed 0 tokens
3. 🤔 Confused: "Where are my tokens?!"

**The Issue**:

**Local Node** (`localhost:8545`):
- Was syncing/following the testnet
- But lagging a few blocks behind
- Hadn't processed block 4,802,263 yet (where faucet transaction was)
- Showed: 0 AlphaUSD

**Public RPC** (`https://rpc.testnet.tempo.xyz`):
- Always up-to-date (source of truth)
- Had already processed the faucet transaction
- Showed: 2,000,000 AlphaUSD ✅

**The Solution**:

Created `src/check-token-public.js` that connects to public RPC instead of local node:

```javascript
// Local node (might be behind)
const provider = new ethers.JsonRpcProvider('http://localhost:8545');

// Public RPC (always current)
const provider = new ethers.JsonRpcProvider('https://rpc.testnet.tempo.xyz');
```

**Commands**:
```bash
# Wrong: Checks local node (might be behind)
node src/check-token.js 0x20c0000000000000000000000000000000000001

# Right: Checks public testnet (source of truth)
node src/check-token-public.js 0x20c0000000000000000000000000000000000001
```

---

**Key Insights**:

1. **ERC-20 Token Contracts**: 
   - Tokens are managed by smart contracts
   - Not stored directly on blockchain like native balance
   - Need to call `contract.balanceOf(address)` to check balance
   - Standard interface (ABI) works for all ERC-20/TIP-20 tokens

2. **Decimals Matter**:
   - AlphaUSD has 6 decimals (like real USDC)
   - 1 AlphaUSD = 1,000,000 smallest units
   - Raw balance: 2,000,000,000,000 units
   - Human-readable: 2,000,000.0 AlphaUSD

3. **Local vs Remote Nodes**:
   - **Local nodes can lag**: They're syncing from the network
   - **Public RPCs are real-time**: They ARE the network (or close to it)
   - **For testing**: Use public RPC to verify transactions immediately
   - **For production**: Run own nodes (reliability) or use hosted RPC (convenience)

4. **Tempo's Faucet is Generous**:
   - Gave 2M AlphaUSD (not just 1M)
   - Probably distributed across multiple stablecoins
   - More than enough for testing

**Business Insight for Rho**:

If Rho integrates Tempo, the node infrastructure decision matters:
- **Run own nodes**: More control, privacy, but operational overhead
- **Use hosted RPC**: Easier, but dependency on third party
- **Hybrid**: Own nodes for critical ops, hosted for ancillary services

Having experienced the sync lag firsthand, I understand why enterprises might prefer hosted solutions for production despite higher costs.

---

**What I Learned About Token Architecture**:

```
Checking Native Balance (TEMPO):
  My Wallet → Blockchain State → Balance stored directly
  Simple! Just ask: "How much TEMPO at this address?"

Checking Token Balance (AlphaUSD):
  My Wallet → Token Contract → Contract's internal ledger
  Complex! Must ask contract: "What's your record for this address?"
```

**Why this architecture?**
- Native tokens: Part of core protocol
- ERC-20 tokens: Implemented as smart contracts
- Flexibility: Anyone can create new tokens
- Standard interface: All tokens work the same way

**Ready for next step**: Send my first payment! 🚀

---

### Second Wallet Created (Wallet B) - Recipient for P2P Testing

**What I built**:
- ✅ Generated second test wallet using `wallet.js create`
- ✅ Restructured `.env` with clear A/B wallet naming
- ✅ Both wallets ready for P2P transfer testing

**Wallet Configuration**:

**Wallet A (Sender)**:
- Address: `0x9bFc636780A6135EFEF7614D782E8Cb39d65Add3`
- Funded: 2,000,000 AlphaUSD ✅
- Purpose: Send test payment
- Stored as: `WALLET_A_PRIVATE_KEY` / `WALLET_A_ADDRESS`

**Wallet B (Recipient)**:
- Address: `0x4DC5115571f2397B96554dF1002cB60B2D1DE794`
- Funded: 0 AlphaUSD (intentionally unfunded)
- Purpose: Receive test payment
- Stored as: `WALLET_B_PRIVATE_KEY` / `WALLET_B_ADDRESS`

**Why Two Wallets?**:
- Need both sender and recipient to test P2P transfer
- Wallet A → Wallet B demonstrates actual payment flow
- Can observe balance changes on both sides
- Proves the transaction worked end-to-end

**Why Not Fund Wallet B?**:
- Starts at 0 AlphaUSD
- After we send payment: Will have X AlphaUSD
- Clear proof the transfer worked
- No ambiguity about where funds came from

**Updated .env Structure**:
```
# Wallet A (Sender - Funded with 2M AlphaUSD)
WALLET_A_PRIVATE_KEY=0x...
WALLET_A_ADDRESS=0x9bFc636780A6135EFEF7614D782E8Cb39d65Add3

# Wallet B (Recipient - Unfunded)
WALLET_B_PRIVATE_KEY=0x...
WALLET_B_ADDRESS=0x4DC5115571f2397B96554dF1002cB60B2D1DE794
```

**Cleanup: Removed Legacy Variables**:
- Originally added `WALLET_PRIVATE_KEY` / `WALLET_ADDRESS` for "backward compatibility"
- Realized this was unnecessary duplication (just 3 scripts affected)
- Updated `loadWallet()` function in `wallet.js` to use `WALLET_A_PRIVATE_KEY` directly
- Now all scripts explicitly use `WALLET_A_*` (cleaner, less confusing)
- Tested: `balance.js` and `check-token-public.js` work perfectly with new structure

**Key Insight**:
- Clear naming prevents confusion (`WALLET_A_*` vs `WALLET_B_*`)
- No duplication - each wallet has one set of variables
- When we build `send.js`, we'll use `WALLET_A_*` for sender, `WALLET_B_*` for recipient

**What This Enables**:
- ✅ Can now build `src/send.js` to transfer AlphaUSD
- ✅ Can verify balance changes on both wallets
- ✅ Can measure actual transaction costs and timing
- ✅ Core POC milestone ready to execute

**Next**: Build the payment script (`send.js`) to send first stablecoin payment from Wallet A → Wallet B!

---

### Updated Balance Checker - Dual Wallet View

**What I improved**:
- ✅ Updated `balance.js` to show BOTH wallets side-by-side
- ✅ Added support for checking any token by name or address
- ✅ Switched to public RPC for real-time, reliable data
- ✅ Built-in token shortcuts (pathUSD, AlphaUSD, BetaUSD, ThetaUSD)

**New Usage**:
```bash
# Check AlphaUSD balances for both wallets
node src/balance.js AlphaUSD

# Check pathUSD balances  
node src/balance.js pathUSD

# Use full contract address
node src/balance.js 0x20c0000000000000000000000000000000000001

# Check only native TEMPO
node src/balance.js none
```

**What This Shows**:
```
Wallet A (Sender):
  ⚡ Native TEMPO: 4.24e+45
  💰 AlphaUSD: 2,000,000.0

Wallet B (Recipient):
  ⚡ Native TEMPO: 4.24e+45
  💰 AlphaUSD: 0.0
```

**Why This Matters**:
- Can instantly verify payment worked by seeing balance changes on both sides
- No need to run multiple commands or track addresses manually
- Perfect for testing P2P transfers: Send 100 AlphaUSD, run `balance.js AlphaUSD`, see Wallet A decrease and Wallet B increase

**Discovery**: Wallet A has 2M tokens in BOTH pathUSD and AlphaUSD! The faucet was more generous than expected, giving multiple stablecoins.

**Ready**: Now fully prepared to send first payment and observe the results!

---

### First Stablecoin Payment - Success & Key Learnings

**What I did**:
- ✅ Built `src/send.js` - Payment script for token transfers
- ✅ Successfully sent 10,000 AlphaUSD from Wallet A → Wallet B
- ✅ Successfully sent 5,000 AlphaUSD from Wallet B → Wallet A
- ✅ Tested bidirectional payments

**Transaction Details**:
- Confirmation time: ~1.5-4.5 seconds (vs Tempo's <1s claim)
- Gas used: ~24,000-55,000 units
- Gas paid in: Native TEMPO tokens
- Block explorer verification: All transactions visible on-chain

**send.js Features Built**:
- Token name shortcuts (AlphaUSD, pathUSD, etc.)
- Silent balance validation (only errors if insufficient)
- Transaction confirmation with clear success message
- Performance analysis vs Tempo claims
- Block explorer links
- Clean UX matching real payment receipts (no balance spam)

---

### Critical Discovery: Fee-on-Transfer Tokens

**The Problem Encountered**:

Attempted to send 10,000 pathUSD from Wallet B → Wallet A and transaction **REVERTED**.

**Initial hypothesis**: Not enough TEMPO for gas fees
**Actual cause**: Insufficient pathUSD token balance

**Root Cause Analysis**:

**Original balances** (from faucet):
- Wallet A: 2,000,000 pathUSD
- Wallet B: 0 pathUSD

**After sending 10,000 pathUSD from A → B**:
- Wallet A: 1,989,999.999248 pathUSD
- Wallet B: 9,999.999759 pathUSD

**The math**:
```
Wallet A lost:  10,000.000752 pathUSD
Wallet B gained: 9,999.999759 pathUSD
Fee charged:     0.000993 pathUSD (~0.001% per transfer)
```

**Why the transaction failed**:
- Wallet B balance: 9,999.999759 pathUSD
- Attempted to send: 10,000 pathUSD
- Result: Insufficient balance → Contract reverted the transaction

### Understanding Fee-on-Transfer Tokens

**What they are**:
- Tokens that automatically deduct fees DURING the transfer
- Fee is taken from the transfer amount itself, not from remaining balance
- Common in DeFi tokens, some stablecoins

**How they work**:
```
You send: 10,000 tokens
Contract deducts: ~0.001 tokens (fee)
Recipient gets: 9,999.999 tokens
Your balance decreases by: 10,000.001 tokens (amount + fee)
```

**Both Tempo testnet stablecoins have fees**:
- **pathUSD**: ~0.001 pathUSD per transfer (~0.001%)
- **AlphaUSD**: ~0.0007 AlphaUSD per transfer (~0.00007%)

These are microscopic compared to traditional payment fees, but they exist!

---

### Major UX Insight: Stablecoin vs Fiat Payment Divergence

**The Fundamental Problem**:

**Fiat payments (traditional banking)**:
```
Balance: $10,000
Action: Send $10,000 to recipient
Fee: $25 wire fee
Result: ✅ SUCCESS
        - Your account: $10,000 - $25 = $9,975 remaining
        - Recipient gets: $10,000
        - OR total charge: $10,025 (amount + fee shown separately)
```

**Blockchain payments (current behavior)**:
```
Balance: 10,000 tokens
Action: Send 10,000 tokens
Fee: 0.001 tokens (embedded in transfer)
Result: ❌ TRANSACTION REVERTS
        - Contract needs: 10,000 + 0.001 = 10,000.001 tokens
        - You only have: 10,000 tokens
        - Insufficient balance!
```

**Why this is bad UX**:
- Users expect to send their full balance (like fiat)
- Blockchain requires buffer for fees
- No clear "max sendable" amount shown
- Error messages don't explain the fee issue
- Breaks mental model from traditional payments

**Real-world parallel**:
Imagine your bank saying "You have $10,000 but can only send $9,999.99 because fees" - confusing!

---

### Business Implication for Rho

**If Rho integrates stablecoin payments, must solve**:

1. **Fee Preview**:
   ```
   Sending: 10,000 AlphaUSD
   Transfer fee: ~0.001 AlphaUSD
   Total needed: 10,000.001 AlphaUSD
   Your balance: 10,000 AlphaUSD
   ❌ Insufficient! Max sendable: 9,999.999 AlphaUSD
   ```

2. **"Send Max" Button**:
   - Calculate: `maxSendable = balance * 0.9999` (account for fee)
   - Auto-adjust amount to leave room for fees
   - Common in crypto wallets, rare in traditional banking

3. **Better Error Messages**:
   - Current: "Transaction reverted" (cryptic)
   - Better: "Insufficient balance including transfer fee. Try sending 9,999.99 instead."

4. **Fee Education**:
   - Users from traditional banking won't expect embedded fees
   - Need clear explanation: "This token charges ~0.001% per transfer"
   - Show fees in dollars, not just token amounts

**Why This Matters**:
- **Competitive advantage**: Ramp/Mercury likely have same UX problems
- **User retention**: Poor UX = customer frustration = churn  
- **Support costs**: Users will call support asking "why can't I send my full balance?"
- **Regulatory clarity**: Need to disclose fees upfront (like Reg E for ACH)

**Key Insight**: 
Blockchain's technical architecture (fee-on-transfer) **diverges from user expectations** built over decades of traditional banking. Whoever bridges this gap wins the fintech customers.

---

### Technical Understanding: Gas vs Token Fees

**Two separate fee systems** (often confused):

**1. Gas Fees** (Blockchain-level):
- Paid in: Native TEMPO tokens
- For: Transaction processing by validators
- Amount: ~24,000-55,000 gas units per transfer
- Cost: Fixed ~$0.001 (Tempo's claim)
- Paid by: Transaction sender (always)
- When: Every transaction (read = free, write = costs gas)

**2. Token Transfer Fees** (Token contract-level):
- Paid in: The token being transferred (pathUSD, AlphaUSD)
- For: Token contract logic (anti-spam, protocol revenue, etc.)
- Amount: ~0.001 tokens per transfer
- Cost: Varies by token (~0.001% to 0.1%)
- Paid by: Sender (deducted from transfer amount)
- When: Only if token contract implements it

**Example transaction breakdown**:
```
Sending 10,000 AlphaUSD from Wallet A → Wallet B

From Wallet A's perspective:
- AlphaUSD balance decreases: 10,000.0007 (amount + token fee)
- TEMPO balance decreases: ~0.00005 (gas fee)

Wallet B receives:
- AlphaUSD balance increases: 10,000.0000
```

**Key point**: 
Gas is paid in TEMPO, token fees are paid in the token itself. Two completely separate fee systems!

---

## Web Dashboard Development - Understanding the Tech Stack

### What We're Building

**Project**: Modern web dashboard for Tempo stablecoin payments  
**Tech Stack**: Next.js 14 + React + ShadCN UI + Wagmi + Viem + Tempo.ts  
**Purpose**: Phase 3 of the POC - Build production-quality UI with passkey authentication

---

### Understanding Wagmi: The Industry Standard

**What is Wagmi?**

Wagmi is **React hooks for blockchain** - it's like what React Router is for navigation, but for Ethereum/blockchain interactions.

**Built by**: Wevm team (NOT Tempo)  
**Status**: Industry standard used by Coinbase, Uniswap, ENS, OpenSea, Rainbow Wallet, and thousands of dApps

**The Problem Wagmi Solves**:

Without Wagmi:
```
Your React App → Manually manage wallet connections
                → Write complex signing logic
                → Handle state management yourself
                → Deal with reconnections, errors
                → Hundreds of lines of boilerplate
```

With Wagmi:
```
Your React App → Wagmi (React Hooks) → Blockchain
                → useConnect(), useAccount(), useDisconnect()
                → 10 lines instead of 100
```

**Simple Mental Model**:
- **Wagmi** = Smart assistant who handles all blockchain complexity
- **You** = Focus on building UI and user experience
- **Result** = Production-ready blockchain app with minimal code

**Key Hooks We Use**:
```typescript
const { address, isConnected } = useAccount()
// Know: user's wallet address, connection status

const { connect, connectors } = useConnect()
// Connect: user's wallet with one function call

const { disconnect } = useDisconnect()
// Disconnect: with one function call
```

---

### Understanding Tempo.ts: Tempo's Extensions

**What is Tempo.ts?**

Tempo's library that **extends Wagmi** with Tempo-specific features, most importantly: passkey authentication.

**Built by**: Tempo team  
**Purpose**: Add Tempo innovations on top of industry-standard Wagmi

**What Tempo.ts Provides**:
1. **webAuthn connector** - Passkey authentication (plugs into Wagmi)
2. **KeyManager** - Stores passkey credentials
3. **Tempo-specific hooks** - For Tempo blockchain features

---

### The Tech Stack Architecture

**How Everything Fits Together**:

```
┌─────────────────────────────────────┐
│  Your React App                     │
│  - Button handlers                  │
│  - UI components                    │
│  - User experience                  │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Tempo.ts (Tempo's additions)       │
│  - webAuthn connector               │
│  - KeyManager                       │
│  - Tempo-specific features          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Wagmi (Industry standard)          │
│  - useConnect, useAccount, etc.     │
│  - Connector API                    │
│  - React hooks for blockchain       │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Viem (Industry standard)           │
│  - Low-level blockchain functions   │
│  - Transaction signing              │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Tempo Blockchain                   │
│  - Processes transactions           │
│  - Stores data on-chain             │
└─────────────────────────────────────┘
```

**Analogy**:
- **Wagmi + Viem** = Standard car parts (wheels, engine, transmission) - Industry proven
- **Tempo.ts** = Tesla's electric motor + self-driving - Innovation on top
- **Your App** = The driving experience you design

---

### How We Implemented Passkey Authentication

**Step 1: Configure Wagmi (lib/wagmi.ts)**

```typescript
// 1. Import Tempo's passkey connector
import { webAuthn, KeyManager } from 'tempo.ts/wagmi'

// 2. Create a key manager (stores passkey credentials)
const keyManager = KeyManager.localStorage()
// Stores credentials in browser localStorage
// (POC only - production needs backend storage)

// 3. Configure Wagmi with passkey connector
export const wagmiConfig = createConfig({
  chains: [TEMPO_TESTNET],
  connectors: [
    webAuthn({
      keyManager,              // Where to store passkeys
      rpId: 'localhost',       // Domain for passkey binding
    }),
  ],
  transports: {
    [TEMPO_TESTNET.id]: http('https://rpc.testnet.tempo.xyz'),
  },
})
```

**What's happening**:
- Telling Wagmi: "Use passkeys for authentication"
- Telling passkey system: "Store credentials in localStorage"
- Telling WebAuthn: "This passkey is for localhost"

---

**Step 2: Use Wagmi Hooks in React (app/page.tsx)**

```typescript
// 1. Get Wagmi's connection tools
const { connect, connectors } = useConnect()
const { address, isConnected } = useAccount()
const connector = connectors[0] // webAuthn connector

// 2. Sign Up = Create new passkey
const handleSignUp = async () => {
  await connect({
    connector,           // Use passkey connector
    chainId: 42429,      // Tempo testnet
    capabilities: {
      type: 'sign-up',   // Tell Tempo: NEW user
      label: 'Tempo Wallet',  // Name for passkey
    },
  })
}

// 3. Sign In = Use existing passkey
const handleSignIn = async () => {
  await connect({
    connector,
    chainId: 42429,
    capabilities: {
      type: 'sign-in',   // Tell Tempo: Find EXISTING passkey
    },
  })
}
```

---

### What Happens Behind the Scenes

**When User Clicks "Sign Up"**:

```
1. Your React app calls connect()
   ↓
2. Wagmi tells passkey connector: "Create new passkey"
   ↓
3. Tempo.ts uses WebAuthn API: "Ask browser for biometric"
   ↓
4. Browser prompts: "Touch fingerprint" or "Face ID"
   ↓
5. WebAuthn creates: Public/private key pair
   ↓
6. Public key → Stored in localStorage (via keyManager)
   ↓
7. Private key → Stored in secure hardware (Apple Secure Enclave, etc.)
   ↓
8. Tempo derives: Blockchain wallet address from public key
   ↓
9. Wagmi updates: isConnected = true, address = "0x..."
   ↓
10. Your React app: Sees isConnected and shows dashboard
```

**When User Clicks "Sign In"**:

```
1. Your React app calls connect()
   ↓
2. Wagmi tells passkey connector: "Use existing passkey"
   ↓
3. Tempo.ts asks localStorage: "What passkeys do we have?"
   ↓
4. Browser shows: "Select your passkey"
   ↓
5. User picks saved passkey and authenticates (Touch ID/Face ID)
   ↓
6. WebAuthn retrieves: Public key from secure hardware
   ↓
7. Tempo derives: Wallet address from public key
   ↓
8. Wagmi updates: isConnected = true, address = "0x..."
   ↓
9. Your React app: Shows connected screen
```

---

### Why Passkeys Are Better Than Seed Phrases

**Traditional Crypto (MetaMask-style)**:
```
1. User writes down 12-word seed phrase
2. User must safely store those words
3. To recover: Type all 12 words correctly
4. If lost → Money is GONE forever
5. If stolen → Attacker has full control
6. Phishing risk → Fake sites steal phrases
```

**Passkeys (What We Built)**:
```
1. User touches fingerprint or Face ID
2. Key stored in secure hardware (Secure Enclave)
3. To sign in: Just touch fingerprint again
4. If lost device → Key stays in cloud backup
5. Can't be stolen remotely → Biometric required
6. No phishing → Passkey is domain-bound
```

**Security Benefits**:
- **Private key never leaves device** - Stored in secure hardware
- **Biometric requirement** - Can't be phished or stolen
- **Domain binding** - Passkey only works on correct website
- **No human error** - No writing down words incorrectly

**UX Benefits**:
- **One tap** - Touch fingerprint vs typing 12 words
- **No training needed** - Users already know Face ID
- **Cross-device sync** - iCloud Keychain, Google Password Manager
- **Recovery built-in** - Device backup includes passkeys

---

### Industry Standard vs Tempo Innovation

**What's Standard** (Use anywhere):
- **Wagmi** - React hooks for blockchain (works on Ethereum, Polygon, Arbitrum, Base, Tempo, etc.)
- **Viem** - Low-level Ethereum library
- **TanStack Query** - Data fetching (used by Wagmi)
- **React** - UI framework

**What's Tempo-Specific**:
- **Tempo.ts** - Passkey connector, Tempo hooks
- **webAuthn connector** - Implements passkey auth
- **KeyManager** - Credential storage
- **Tempo blockchain** - The actual network

**Why This Matters for Rho**:

1. **Developer Familiarity** ✅
   - Most Ethereum developers already know Wagmi
   - Faster hiring, easier onboarding
   - Huge community for support

2. **Not Locked In** ✅
   - Using industry standards, not proprietary tech
   - Could switch blockchains later (Wagmi works everywhere)
   - Reduce vendor lock-in risk

3. **Proven Technology** ✅
   - Wagmi used by Coinbase, Uniswap, major protocols
   - Battle-tested in production
   - Regular security audits

4. **Tempo Innovates on Top** ✅
   - Passkeys are Tempo's unique value-add
   - Riding industry standards + adding innovation
   - Like using Stripe API (standard) + Stripe Connect (innovation)

---

### Technical Components Summary

| Component | Type | Purpose | Who Built It |
|-----------|------|---------|--------------|
| **React** | Framework | Build UI | Meta (industry standard) |
| **Next.js** | Framework | Server-side React | Vercel (industry standard) |
| **Tailwind** | Styling | CSS framework | Tailwind Labs (industry standard) |
| **ShadCN** | UI Library | Component library | shadcn (open source) |
| **Wagmi** | Blockchain | React hooks | Wevm (industry standard) |
| **Viem** | Blockchain | Low-level library | Wevm (industry standard) |
| **Tempo.ts** | Blockchain | Tempo extensions | Tempo (proprietary) |
| **webAuthn** | Auth | Passkey connector | Tempo (proprietary) |
| **KeyManager** | Auth | Credential storage | Tempo (proprietary) |

**Split**: ~80% industry standard, ~20% Tempo-specific

---

### Key Insights for Rho

**1. Smart Technology Choice**:
Tempo didn't reinvent the wheel - they built on proven standards (Wagmi) and added innovation (passkeys). This is a good sign for:
- **Stability** - Not bleeding-edge unproven tech
- **Talent** - Easy to find developers who know React + Wagmi
- **Longevity** - Won't be abandoned (Wagmi has huge community)

**2. Passkeys Are a Game-Changer**:
The UX difference between seed phrases and passkeys is massive:
- **Traditional crypto**: 12-word phrases, constant anxiety, hard to onboard users
- **Passkeys**: Touch fingerprint, feels like normal apps, mainstream-ready

If Rho integrates Tempo, the passkey UX could be a major selling point vs competitors.

**3. Not Locked Into Tempo**:
Because we're using Wagmi (standard), switching blockchains later is possible:
- Same React code
- Different connector
- Different RPC endpoint
This reduces strategic risk of committing to Tempo.

**4. The Stack Works**:
In ~3 steps of our implementation plan:
- ✅ Set up modern Next.js app
- ✅ Integrated industry-standard Wagmi
- ✅ Added Tempo passkey authentication
- ✅ Users can sign in with Face ID

This was shockingly easy compared to traditional blockchain development.

---

### What We Built

**Dashboard Foundation** (`/Users/rishi/Documents/GitHub/tempo/dashboard/`):
- ✅ Next.js 14 with TypeScript, App Router
- ✅ Tailwind CSS + ShadCN UI (8 components)
- ✅ Wagmi configured for Tempo testnet
- ✅ webAuthn passkey connector integrated
- ✅ Landing page with sign up/sign in
- ✅ Authentication flow working
- ✅ Dark mode support
- ✅ Development server running at http://localhost:3001

**Current Status**:
- ✅ Users can create passkey account (sign up)
- ✅ Users can sign in with existing passkey
- ✅ Users see wallet address when connected
- ✅ Connection state management with error handling
- ✅ Dashboard layout with navigation and protected routes
- ✅ Token balances displayed with real-time data
- 🚧 Ready to add faucet integration
- 🚧 Ready to build send payment form

**Completed** (Steps 1-8):
- ✅ Step 1-2: Project setup (Next.js, Wagmi, Tempo.ts)
- ✅ Step 3: Landing page with authentication UI
- ✅ Step 4: Passkey authentication flow
- ✅ Step 5: Dashboard layout with navbar and protected routes
- ✅ Step 6: Token balance display with auto-refresh
- ✅ Step 7: Send payment form with passkey signing ✅ WORKING
- ✅ Step 8: Testnet faucet integration
- ✅ Step 9: **Added memo support for payment tracking** (Dec 16, 2024)
  - Aligned with latest Tempo docs
  - 32-byte memo field for invoice/order tracking
  - Perfect for Rho Banking AP/AR automation

**Next Steps**:
- Step 10: Implement receive page with QR codes
- Step 11: Create transaction history ledger with memo search
- Step 12: Add batch payment support for payroll use cases

---

### Send Payment UI Improvements

**Challenge**: Original layout was cramped with poor visual hierarchy and weak success feedback

**Solution**: Redesigned with professional two-column layout and prominent success state

**Key Improvements**:

1. **Two-Column Layout**
   - Left column (2/3 width): Form and success message
   - Right column (1/3 width): Info cards (Gas Fees, Payment Memos)
   - Better use of screen real estate
   - Responsive: stacks on mobile

2. **Prominent Success Card**
   - Large green card with gradient background
   - Checkmark icon for visual confirmation
   - Shows: amount, token, recipient, memo
   - Action buttons: "View on Explorer", "Copy TX Hash"
   - Appears between header and form
   - Smooth animation on success

3. **Visual Polish**
   - Info cards with icon badges
   - Better spacing and hierarchy
   - Dark mode optimized
   - Professional Stripe-like appearance

**Before vs After**:
```
Before: Single column, tiny toast notification
After: Two columns, prominent success card with actions
```

**UX Impact**:
- Success is immediately visible
- Copy TX hash with one click
- Explorer link prominently displayed
- Form remains visible for next transaction
- Info cards easily discoverable

This creates a professional payment experience suitable for business applications like Rho Banking.

---

### Token Balance Display (Step 6)

**Challenge**: Fetch and display balances for all 4 testnet stablecoins in real-time

**Solution**: Built a custom React hook using Wagmi's `useReadContracts` for batch queries

**Architecture**:
```
Dashboard Page
  ↓
useTokenBalances() hook
  ↓
Wagmi's useReadContracts()
  ↓
Tempo RPC (batch request for all tokens)
  ↓
Returns: balances, symbols, decimals
  ↓
Format and display in UI
```

**Key Files Created**:
1. **`hooks/useTokenBalances.ts`** - Custom hook for fetching all token balances
2. **`lib/abi.ts`** - ERC-20 ABI for token contract interactions

**How It Works**:

```typescript
// 1. Get user's wallet address
const { address } = useAccount()

// 2. Create batch read requests for ALL tokens (4 tokens × 3 calls = 12 calls)
const contracts = tokens.flatMap(([name, tokenAddress]) => [
  { functionName: 'balanceOf', args: [address] },  // Get balance
  { functionName: 'symbol' },                       // Get symbol
  { functionName: 'decimals' },                     // Get decimals
])

// 3. Wagmi batches these into ONE RPC call (efficient!)
const { data, isLoading, refetch } = useReadContracts({
  contracts,
  query: {
    refetchInterval: 10000,  // Auto-refresh every 10 seconds
  },
})

// 4. Parse results and format for display
const balances = tokens.map((token, index) => {
  const balance = data[index * 3]
  const symbol = data[index * 3 + 1]
  const decimals = data[index * 3 + 2]
  return {
    formatted: formatUnits(balance, decimals),
    symbol,
    // ... other fields
  }
})
```

**UI Features**:
- ✅ Shows all 4 stablecoins (pathUSD, AlphaUSD, BetaUSD, ThetaUSD)
- ✅ Auto-refreshes every 10 seconds
- ✅ Manual refresh button
- ✅ Loading skeletons while fetching
- ✅ Total balance calculation (sum of all stablecoins)
- ✅ Formatted numbers with proper decimals and commas

**Performance Optimization**:
- **Batch requests**: 12 contract calls → 1 RPC request (thanks to Wagmi)
- **Auto-caching**: TanStack Query caches results, reduces redundant calls
- **Smart refetching**: Only refetches when address changes or on interval

**User Experience**:
```
Dashboard loads
  ↓
Shows loading skeletons (good UX)
  ↓
Fetches all balances in parallel
  ↓
Displays formatted balances
  ↓
Auto-refreshes every 10 seconds (stays up-to-date)
```

**What This Demonstrates**:
- Wagmi makes multi-contract reads trivial (vs 100+ lines of raw ethers.js code)
- React hooks provide clean, reusable logic
- TanStack Query handles caching and refetching automatically
- User sees real-time balance updates without manual refresh

---

### Send Payment Form (Step 7)

**Challenge**: Build a user-friendly payment form with passkey transaction signing

**Solution**: Created a complete send payment flow using Wagmi's `useWriteContract` hook

**Architecture**:
```
User fills form (token, recipient, amount)
  ↓
Click "Send Payment"
  ↓
Browser prompts for passkey (Face ID/Touch ID)
  ↓
Passkey signs transaction
  ↓
Transaction sent to Tempo blockchain
  ↓
Wait for confirmation
  ↓
Show success + link to explorer
```

**Key Features Implemented**:

1. **Token Selection Dropdown**
   - Shows all available tokens with current balances
   - Example: "AlphaUSD - Balance: 1,900,000.00"

2. **Recipient Address Input**
   - Validates Ethereum address format (0x + 40 hex characters)
   - Font-mono for better readability

3. **Amount Input**
   - Number input with decimal support
   - Shows USD equivalent (1:1 for stablecoins)
   - Quick buttons: 25%, 50%, 75%, Max

4. **Real-time Validation**
   - Checks sufficient balance before sending
   - Validates address format
   - Ensures all fields are filled

5. **Transaction Flow**
   - Button states: Normal → Sending → Confirming → Success
   - Passkey prompt for signing
   - Toast notifications at each step
   - Transaction hash displayed with explorer link

6. **Error Handling**
   - Insufficient balance
   - Invalid address
   - Network errors
   - User cancellation (passkey declined)

**Code Highlights**:

```typescript
// 1. Wagmi hook for writing to blockchain
const { writeContract, isPending } = useWriteContract()

// 2. Wait for transaction confirmation
const { isLoading: isConfirming } = useWaitForTransactionReceipt({
  hash: txHash,
})

// 3. Send the transaction
const hash = await writeContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [recipient, parseUnits(amount, decimals)],
})

// 4. Passkey automatically prompts user to sign
// No private key management needed!
```

**UX Flow**:
1. **Select Token** → Dropdown shows balances
2. **Enter Recipient** → Validates format
3. **Enter Amount** → Shows USD equivalent
4. **Click Send** → Passkey prompt appears
5. **Approve with biometrics** → Transaction sent
6. **Wait for confirmation** → Spinner + status updates
7. **Success!** → Toast with explorer link

**What Makes This Special**:

- **No private keys exposed** - Passkey handles all signing
- **Simple UX** - 3 fields, 1 button, done
- **Real-time feedback** - Loading states, error messages, confirmations
- **Safe by default** - Validates everything before sending
- **Professional UI** - Matches Stripe/modern fintech apps

**Compared to CLI** (`node src/send.js`):
```
CLI: node src/send.js <address> <amount> <token>
  → Requires terminal access
  → No balance check warnings
  → No address validation
  → Text-only output

Web UI: Click, fill form, send
  → Visual balance display
  → Real-time validation
  → Passkey signing (secure!)
  → Beautiful transaction receipt
```

**Business Value for Rho**:
- ✅ Clean, professional payment experience
- ✅ No technical knowledge required
- ✅ Secure (passkeys > private keys)
- ✅ Fast (sub-second transactions on Tempo)
- ✅ Transparent (explorer links, tx hashes)
- ✅ Ready for vendor payments, payroll, bill pay

---

### Testnet Faucet Integration (Step 8)

**Challenge**: Users need a way to fund new wallets with testnet tokens for testing

**Solution**: Integrated Tempo.ts's built-in faucet hook for one-click testnet funding

**Implementation**:

```typescript
// Use Tempo.ts faucet hook
import { Hooks } from 'tempo.ts/wagmi'

const { mutate: addFunds, isPending } = Hooks.faucet.useFundSync()

// Request testnet funds
addFunds({ account: userAddress })
```

**Key Features**:
- ✅ One-click testnet funding
- ✅ Requests AlphaUSD automatically
- ✅ Toast notifications for success/error
- ✅ Loading states during request
- ✅ Button placed prominently next to balances

**UX Flow**:
1. User clicks "Add Testnet Funds" button
2. Faucet API requests tokens for user's address
3. Transaction confirmed on Tempo testnet
4. Balance auto-refreshes
5. User can now test payments!

**Why This Matters**:
- **Onboarding**: New users can fund wallets instantly
- **Testing**: No need for external faucet websites
- **UX**: Seamless - integrated right into dashboard
- **Rate Limits**: Faucet handles rate limiting automatically

**Passkey Wallet Insight**:
- Passkey wallets have NO private keys
- Can't be used with CLI (which requires private keys)
- Faucet is essential for funding passkey wallets
- Old wallet's funds ($3.4M testnet tokens) are stuck until WebAuthn issue is fixed

---

### Comparison: CLI vs Web Dashboard

**What we learned in CLI** (Phases 1-2):
- ✅ How blockchain works (RPC, transactions, gas)
- ✅ Token contracts and ERC-20 standard
- ✅ Fee mechanics (gas + token fees)
- ✅ Local vs public RPC nodes
- ✅ Fee-on-transfer tokens
- ✅ P2P transfers

**What we're adding in Web UI** (Phase 3):
- ✅ Passkey authentication (no seed phrases!)
- ✅ Modern React application
- ✅ Industry-standard tools (Wagmi)
- ✅ Beautiful UI (ShadCN + Tailwind)
- ✅ Send payments with passkey signing
- ✅ Real-time balance updates
- → Receive payments with QR codes
- → Transaction history
- → Invoice reconciliation with memos

**The Evolution**:
```
CLI Scripts (Learning)
  ↓
Understanding Core Concepts
  ↓
Web Dashboard (Production-Ready UX)
  ↓
Business Evaluation for Rho
```

---

### Payment Memos for Business Reconciliation (Step 9)

**Challenge**: Businesses need to track payments for invoice matching and reconciliation

**Solution**: Implemented memo field in send payment form, aligned with latest Tempo docs

**What is a Memo?**:
- **32-byte field** attached to each payment transaction
- Stored **on-chain** (permanent, immutable record)
- Used for **invoice numbers, order IDs, payment references**
- Think of it like the "memo" line on a check, but cryptographically verified

**How It Works**:

```typescript
// 1. User enters memo text
const memo = "INV-12345"

// 2. Convert to 32-byte hex string
const memoHex = pad(stringToHex(memo), { size: 32 })
// Result: 0x494e562d3132333435000000000000000000000000000000000000000000000000

// 3. Include in payment transaction
sendPayment.mutate({
  amount: parseUnits('100', 6),
  to: recipientAddress,
  token: tokenAddress,
  memo: memoHex, // Attached to transaction
})

// 4. Memo is stored on-chain forever
// Can be retrieved from transaction logs
// Used for reconciliation and tracking
```

**Key Features Implemented**:
- ✅ Optional memo field in send form
- ✅ Max 31 characters (fits in 32 bytes)
- ✅ Converts text to hex automatically
- ✅ Pads to 32 bytes as required by Tempo
- ✅ Shows memo in success notification
- ✅ Stored on-chain for permanent record

**Business Value for Rho**:

1. **Automated Invoice Matching**:
   - Pay vendor with invoice number in memo
   - AP system automatically matches payment to invoice
   - No manual reconciliation needed

2. **Audit Trail**:
   - Every payment has immutable reference on-chain
   - Can prove payment was made for specific invoice
   - Cryptographic verification (no disputes)

3. **Multi-Currency Reconciliation**:
   - Track payments across different stablecoins
   - Filter transactions by memo/invoice
   - Export to accounting systems (QuickBooks, Xero)

4. **Customer Reference**:
   - Include customer order ID in payment
   - Link payment to specific order in database
   - Real-time order status updates

**Example Use Cases**:

```typescript
// Vendor payment
memo: "INV-2024-001"

// Payroll
memo: "PAYROLL-EMP-1234-DEC2024"

// Refund
memo: "REFUND-ORDER-98765"

// Customer payment
memo: "ORDER-12345-CUST-5678"

// Bill pay
memo: "BILL-ACCT-123456-DEC2024"
```

**Why On-Chain Memos Matter**:

Traditional payments:
```
ACH/Wire: Memo often gets lost or truncated
Check: Memo line can be altered/forged
Credit Card: Limited reference data
Problem: No cryptographic proof
```

Tempo on-chain memos:
```
Stored: Forever on blockchain
Immutable: Cannot be changed or deleted
Verifiable: Cryptographically signed
Searchable: Query all transactions with specific memo
Solution: Perfect audit trail
```

**Technical Implementation**:

**Before** (no memo):
```typescript
sendPayment.mutate({
  amount: parseUnits('100', 6),
  to: recipientAddress,
  token: tokenAddress,
})
```

**After** (with memo):
```typescript
const memoHex = memo ? pad(stringToHex(memo), { size: 32 }) : undefined

sendPayment.mutate({
  amount: parseUnits('100', 6),
  to: recipientAddress,
  token: tokenAddress,
  memo: memoHex, // NEW!
})
```

**Alignment with Tempo Docs**:
- ✅ Matches example at https://docs.tempo.xyz/guide/payments/send-a-payment
- ✅ Uses `stringToHex` for text encoding
- ✅ Uses `pad` to ensure 32-byte size
- ✅ Optional field (undefined if not provided)
- ✅ Supports `transferWithMemo` function on token contracts

**Next Steps for Memo Features**:
- Build transaction history page that shows memos
- Add memo search/filter in transaction list
- Export transactions with memos to CSV
- Create invoice matching dashboard (memo → invoice)
- Add memo validation (check for duplicates)

**Key Insight**:
This feature is **THE** differentiator for business payments on Tempo vs traditional banking. No other blockchain makes payment tracking this easy, and no traditional bank offers cryptographically verifiable payment references. This is why Ramp and Mercury are design partners - they see the value for AP/AR automation!

---

