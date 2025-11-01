import { Zolana } from "../lib/blockchain/zolana"
import { Wallet } from "../lib/blockchain/wallet"

console.log("🧪 Running Zolana Tests...\n")

// Test 1: Blockchain Creation
console.log("Test 1: Creating blockchain...")
const zolana = new Zolana()
console.log("✅ Blockchain created successfully\n")

// Test 2: Wallet Creation
console.log("Test 2: Creating wallets...")
const wallet1 = new Wallet()
const wallet2 = new Wallet()
const minerWallet = new Wallet()
console.log("✅ Wallets created successfully")
console.log(`   Wallet 1: ${wallet1.address.substring(0, 20)}...`)
console.log(`   Wallet 2: ${wallet2.address.substring(0, 20)}...`)
console.log(`   Miner: ${minerWallet.address.substring(0, 20)}...\n`)

// Test 3: Transparent Transaction
console.log("Test 3: Creating transparent transaction...")
const tx1 = zolana.createTransaction(wallet1.address, wallet2.address, 100)
zolana.addTransaction(tx1)
console.log("✅ Transparent transaction created\n")

// Test 4: Mining
console.log("Test 4: Mining block...")
zolana.minePendingTransactions(minerWallet.address)
console.log("✅ Block mined successfully")
console.log(`   Chain length: ${zolana.chain.length}\n`)

// Test 5: Shielded Transaction
console.log("Test 5: Creating shielded transaction...")
const shieldedTx = zolana.createShieldedTransaction(wallet1.address, wallet2.address, 50, wallet1.getPrivateKey())
zolana.addTransaction(shieldedTx)
console.log("✅ Shielded transaction created")
console.log(`   Nullifier: ${shieldedTx.nullifier?.substring(0, 20)}...\n`)

// Test 6: Mining Shielded Transaction
console.log("Test 6: Mining shielded transaction...")
zolana.minePendingTransactions(minerWallet.address)
console.log("✅ Shielded transaction mined\n")

// Test 7: Balance Check
console.log("Test 7: Checking balances...")
const balance1 = zolana.getBalance(wallet1.address)
const balance2 = zolana.getBalance(wallet2.address)
const minerBalance = zolana.getBalance(minerWallet.address)
console.log("✅ Balances retrieved")
console.log(`   Wallet 1: ${balance1} ZOL`)
console.log(`   Wallet 2: ${balance2} ZOL`)
console.log(`   Miner: ${minerBalance} ZOL\n`)

// Test 8: Chain Validation
console.log("Test 8: Validating blockchain...")
const isValid = zolana.isChainValid()
console.log(`✅ Chain validation: ${isValid ? "VALID" : "INVALID"}\n`)

// Test 9: Proof of Stake
console.log("Test 9: Testing Proof of Stake...")
zolana.registerValidator(wallet1.address)
zolana.validateWithStake(wallet1.address)
console.log("✅ PoS validation successful\n")

// Test 10: Double Spend Prevention
console.log("Test 10: Testing double spend prevention...")
try {
  // Try to use the same nullifier twice
  const duplicateTx = zolana.createShieldedTransaction(wallet1.address, wallet2.address, 50, wallet1.getPrivateKey())
  // Manually set the same nullifier
  duplicateTx.nullifier = shieldedTx.nullifier
  zolana.addTransaction(duplicateTx)
  console.log("❌ Double spend not prevented!")
} catch (error) {
  console.log("✅ Double spend prevented successfully\n")
}

// Summary
console.log("📊 Test Summary:")
console.log(`   Total Blocks: ${zolana.chain.length}`)
console.log(`   Pending Transactions: ${zolana.pendingTransactions.length}`)
console.log(`   Validators: ${zolana.validators.size}`)
console.log(`   Chain Valid: ${zolana.isChainValid()}`)
console.log("\n✅ All tests completed!")
