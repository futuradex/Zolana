# Zolana ($ZOL)

A privacy-focused blockchain combining Solana's high-performance architecture with Zcash's zero-knowledge privacy features.

CA: soon

## Overview

Zolana is an educational blockchain implementation that demonstrates advanced concepts including:

- **Privacy Features**: Zero-knowledge proofs, shielded transactions, and selective disclosure
- **Hybrid Consensus**: Both Proof-of-Work (PoW) and Proof-of-Stake (PoS) mechanisms
- **UTXO Model**: Bitcoin-style unspent transaction outputs for better privacy
- **Advanced Cryptography**: Pedersen commitments, range proofs, and nullifiers
- **P2P Network**: Simulated peer-to-peer networking layer
- **Dynamic Difficulty**: Automatic mining difficulty adjustment
- **Mempool**: Transaction memory pool with fee prioritization
- **Shielded Pool**: Separate pool for private transactions
- **Merkle Trees**: Efficient transaction verification
- **HD Wallets**: Hierarchical deterministic wallet support

## Architecture

### Core Components

#### 1. Block Structure (`lib/blockchain/block.ts`)
- Merkle root for efficient verification
- Support for both PoW and PoS
- Transaction statistics and block size calculation
- Dynamic difficulty adjustment

#### 2. Privacy Layer (`lib/blockchain/privacy.ts`)
- Zero-knowledge proof generation and verification
- Pedersen commitments for hiding values
- Range proofs (Bulletproofs-inspired)
- Viewing keys for selective disclosure
- Note encryption for shielded transactions
- Shielded pool management

#### 3. UTXO Model (`lib/blockchain/utxo.ts`)
- Unspent transaction output tracking
- Input/output transaction model
- Balance calculation from UTXOs
- Shielded pool size tracking

#### 4. Consensus Engine (`lib/blockchain/consensus.ts`)
- Validator registration and management
- Stake-weighted validator selection
- Slashing for misbehavior
- Reputation system
- Block verification

#### 5. Mempool (`lib/blockchain/mempool.ts`)
- Pending transaction management
- Fee-based prioritization
- Transaction validation
- Size limits

#### 6. P2P Network (`lib/blockchain/network.ts`)
- Node registration and peer discovery
- Message broadcasting
- Block propagation
- Network latency simulation

#### 7. Merkle Trees (`lib/blockchain/merkle.ts`)
- Efficient transaction verification
- Merkle proof generation
- Proof verification

#### 8. Wallet (`lib/blockchain/wallet.ts`)
- Transparent and shielded addresses
- HD wallet support (child derivation)
- Viewing keys for selective disclosure
- Signature generation and verification
- Import/export functionality

### Transaction Types

#### Transparent Transactions
- Public sender, recipient, and amount
- UTXO-based model
- Efficient verification
- Full auditability

#### Shielded Transactions
- Hidden sender, recipient, and amount
- Zero-knowledge proofs
- Nullifiers prevent double-spending
- Encrypted notes
- Range proofs ensure valid amounts

## Features

### Privacy Features (Zcash-inspired)

1. **Zero-Knowledge Proofs**: Prove transaction validity without revealing details
2. **Shielded Addresses**: Separate address space for private transactions
3. **Nullifiers**: Prevent double-spending in shielded pool
4. **Commitments**: Hide transaction amounts using Pedersen commitments
5. **Range Proofs**: Prove amounts are valid without revealing them
6. **Viewing Keys**: Allow selective disclosure of transaction details
7. **Encrypted Notes**: Secure communication between sender and recipient

### Performance Features (Solana-inspired)

1. **Hybrid Consensus**: Choose between PoW mining or PoS validation
2. **Dynamic Difficulty**: Automatic adjustment for consistent block times
3. **Mempool Optimization**: Fee-based transaction prioritization
4. **UTXO Model**: Parallel transaction processing capability
5. **Merkle Trees**: Efficient verification and light client support
6. **Block Size Limits**: Prevent network congestion

### Network Features

1. **P2P Architecture**: Decentralized node communication
2. **Block Propagation**: Efficient block distribution
3. **Peer Discovery**: Automatic network topology management
4. **Message Queue**: Asynchronous message processing

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Building

\`\`\`bash
npm run build
\`\`\`

### Example Usage

\`\`\`typescript
import { Zolana } from './lib/blockchain/zolana'
import { Wallet } from './lib/blockchain/wallet'

// Create blockchain instance
const zolana = new Zolana()

// Create wallets
const wallet1 = new Wallet()
const wallet2 = new Wallet()

// Create transparent transaction
const tx1 = zolana.createTransaction(
  wallet1.address,
  wallet2.address,
  100,
  0.001
)

if (tx1) {
  zolana.addTransaction(tx1)
}

// Create shielded transaction
const tx2 = zolana.createShieldedTransaction(
  wallet1.address,
  wallet2.address,
  50,
  wallet1.getPrivateKey(),
  0.001
)

if (tx2) {
  zolana.addTransaction(tx2)
}

// Mine block (PoW)
const block = zolana.minePendingTransactions(wallet1.address)

// Or validate with stake (PoS)
zolana.registerValidator(wallet1.address, 10000)
const validatedBlock = zolana.validateWithStake(wallet1.address)

// Check balance
const balance = zolana.getBalance(wallet1.address)

// Get blockchain statistics
const stats = zolana.getBlockchainStats()
console.log('Blockchain Stats:', stats)

// Get network statistics
const networkStats = zolana.getNetworkStats()
console.log('Network Stats:', networkStats)

// Get shielded pool statistics
const shieldedStats = zolana.getShieldedPoolStats()
console.log('Shielded Pool:', shieldedStats)
\`\`\`

## Technical Details

### Consensus Mechanisms

#### Proof of Work (PoW)
- SHA-256 hashing
- Dynamic difficulty adjustment
- Target block time: 10 seconds
- Mining rewards with halving

#### Proof of Stake (PoS)
- Stake-weighted validator selection
- Minimum stake requirement: 1000 ZOL
- Reputation system
- Slashing for misbehavior

### Privacy Implementation

The privacy features are simplified implementations inspired by Zcash's Sapling protocol:

1. **Commitments**: Pedersen-style commitments hide transaction values
2. **Nullifiers**: Unique identifiers prevent double-spending
3. **zk-SNARKs**: Simplified zero-knowledge proofs (conceptual)
4. **Shielded Pool**: Separate accounting for private transactions
5. **Viewing Keys**: Allow auditing without full disclosure

### Security Considerations

This is an educational implementation. For production use, you would need:

- Real zk-SNARK implementation (libsnark, bellman)
- Proper elliptic curve cryptography
- Secure key management
- Network security measures
- Extensive testing and auditing
- Formal verification of cryptographic protocols

## Tokenomics

- **Ticker**: $ZOL
- **Initial Block Reward**: 50 ZOL
- **Halving Interval**: 210,000 blocks
- **Target Block Time**: 10 seconds
- **Minimum Transaction Fee**: 0.0001 ZOL
- **Minimum Validator Stake**: 1000 ZOL
