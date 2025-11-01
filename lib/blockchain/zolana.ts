import { Block, type Transaction } from "./block"
import { PrivacyLayer, ShieldedPool } from "./privacy"
import { UTXOPool } from "./utxo"
import { Mempool } from "./mempool"
import { P2PNetwork } from "./network"
import { ConsensusEngine } from "./consensus"
import crypto from "crypto"

export class Zolana {
  public chain: Block[]
  public difficulty = 4
  public miningReward = 50
  private usedNullifiers: Set<string> = new Set()

  private utxoPool: UTXOPool
  private mempool: Mempool
  private shieldedPool: ShieldedPool
  private network: P2PNetwork
  private consensus: ConsensusEngine
  private blockTime = 10000 // 10 seconds target
  private maxBlockSize = 1000000 // 1MB
  private halvingInterval = 210000 // Blocks until reward halving

  constructor() {
    this.chain = [this.createGenesisBlock()]
    this.utxoPool = new UTXOPool()
    this.mempool = new Mempool()
    this.shieldedPool = new ShieldedPool()
    this.network = new P2PNetwork()
    this.consensus = new ConsensusEngine()
  }

  createGenesisBlock(): Block {
    const genesisBlock = new Block(0, Date.now(), [], "0", undefined, this.difficulty)
    return genesisBlock
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1]
  }

  createTransaction(from: string, to: string, amount: number, fee = 0.001): Transaction | null {
    const availableUTXOs = this.utxoPool.getUTXOsForAddress(from)
    let totalInput = 0
    const inputs: Array<{ txId: string; outputIndex: number; signature: string }> = []

    // Select UTXOs to cover amount + fee
    for (const utxo of availableUTXOs) {
      if (totalInput >= amount + fee) break

      inputs.push({
        txId: utxo.txId,
        outputIndex: utxo.outputIndex,
        signature: crypto.randomBytes(32).toString("hex"),
      })
      totalInput += utxo.amount
    }

    if (totalInput < amount + fee) {
      return null // Insufficient funds
    }

    // Create outputs
    const outputs = [{ address: to, amount, shielded: false }]

    // Add change output if necessary
    const change = totalInput - amount - fee
    if (change > 0) {
      outputs.push({ address: from, amount: change, shielded: false })
    }

    const transaction: Transaction = {
      id: crypto.randomBytes(16).toString("hex"),
      from,
      to,
      amount,
      timestamp: Date.now(),
      shielded: false,
      fee,
      inputs,
      outputs,
    }

    return transaction
  }

  createShieldedTransaction(
    from: string,
    to: string,
    amount: number,
    privateKey: string,
    fee = 0.001,
  ): Transaction | null {
    const shieldedData = PrivacyLayer.shieldTransaction(from, to, amount, privateKey)
    const blindingFactor = crypto.randomBytes(32).toString("hex")
    const commitment = PrivacyLayer.generatePedersenCommitment(amount, blindingFactor)
    const rangeProof = PrivacyLayer.generateRangeProof(amount, commitment)
    const encryptedNote = PrivacyLayer.encryptNote({ value: amount, recipient: to }, to)

    const transaction: Transaction = {
      id: crypto.randomBytes(16).toString("hex"),
      from: shieldedData.shieldedFrom,
      to: shieldedData.shieldedTo,
      amount: 0,
      timestamp: Date.now(),
      shielded: true,
      zkProof: shieldedData.zkProof,
      nullifier: shieldedData.nullifier,
      commitment,
      rangeProof,
      encryptedNote,
      fee,
    }

    return transaction
  }

  addTransaction(transaction: Transaction): boolean {
    // Verify shielded transactions
    if (transaction.shielded) {
      if (!transaction.zkProof || !PrivacyLayer.verifyZKProof(transaction.zkProof)) {
        return false
      }

      if (transaction.rangeProof && !PrivacyLayer.verifyRangeProof(transaction.rangeProof)) {
        return false
      }

      if (transaction.nullifier && this.usedNullifiers.has(transaction.nullifier)) {
        return false
      }

      if (transaction.nullifier && this.shieldedPool.hasNullifier(transaction.nullifier)) {
        return false
      }
    } else {
      // Verify UTXO inputs for transparent transactions
      if (transaction.inputs) {
        for (const input of transaction.inputs) {
          const utxo = this.utxoPool.getUTXO(input.txId, input.outputIndex)
          if (!utxo || utxo.spent) {
            return false
          }
        }
      }
    }

    return this.mempool.addTransaction(transaction)
  }

  minePendingTransactions(minerAddress: string): Block | null {
    const pendingTxs = this.mempool.getTransactionsByFee(100) // Max 100 tx per block

    if (pendingTxs.length === 0) {
      return null
    }

    // Calculate current mining reward with halving
    const currentReward = this.calculateMiningReward()

    const block = new Block(
      this.chain.length,
      Date.now(),
      pendingTxs,
      this.getLatestBlock().hash,
      undefined,
      this.difficulty,
    )

    // Adjust difficulty based on block time
    this.adjustDifficulty()

    block.mineBlock(this.difficulty)

    this.chain.push(block)

    // Update UTXO pool
    this.updateUTXOPool(block)

    // Mark nullifiers as used
    pendingTxs.forEach((tx) => {
      if (tx.nullifier) {
        this.usedNullifiers.add(tx.nullifier)
        this.shieldedPool.spendNote(tx.nullifier)
      }
    })

    // Remove mined transactions from mempool
    this.mempool.removeTransactions(pendingTxs.map((tx) => tx.id))

    // Add mining reward
    const rewardTx = this.createTransaction("network", minerAddress, currentReward, 0)
    if (rewardTx) {
      this.mempool.addTransaction(rewardTx)
    }

    // Propagate block through network
    this.network.propagateBlock(block, "local")

    return block
  }

  validateWithStake(validatorAddress: string): Block | null {
    const selectedValidator = this.consensus.selectValidator()

    if (!selectedValidator || selectedValidator !== validatorAddress) {
      return null
    }

    const pendingTxs = this.mempool.getTransactionsByFee(100)

    if (pendingTxs.length === 0) {
      return null
    }

    const block = new Block(
      this.chain.length,
      Date.now(),
      pendingTxs,
      this.getLatestBlock().hash,
      validatorAddress,
      undefined,
    )

    if (!this.consensus.verifyBlock(block, validatorAddress)) {
      this.consensus.slashValidator(validatorAddress)
      return null
    }

    this.chain.push(block)

    // Update UTXO pool
    this.updateUTXOPool(block)

    // Mark nullifiers as used
    pendingTxs.forEach((tx) => {
      if (tx.nullifier) {
        this.usedNullifiers.add(tx.nullifier)
        this.shieldedPool.spendNote(tx.nullifier)
      }
    })

    this.mempool.removeTransactions(pendingTxs.map((tx) => tx.id))

    // Reward validator
    this.consensus.rewardValidator(validatorAddress, this.calculateMiningReward())

    return block
  }

  private calculateMiningReward(): number {
    const halvings = Math.floor(this.chain.length / this.halvingInterval)
    return this.miningReward / Math.pow(2, halvings)
  }

  private adjustDifficulty(): void {
    if (this.chain.length % 10 !== 0) return

    const last10Blocks = this.chain.slice(-10)
    const avgTime = (last10Blocks[9].timestamp - last10Blocks[0].timestamp) / 9

    if (avgTime < this.blockTime * 0.9) {
      this.difficulty++
    } else if (avgTime > this.blockTime * 1.1 && this.difficulty > 1) {
      this.difficulty--
    }
  }

  private updateUTXOPool(block: Block): void {
    block.transactions.forEach((tx) => {
      // Spend inputs
      if (tx.inputs) {
        tx.inputs.forEach((input) => {
          this.utxoPool.spendUTXO(input.txId, input.outputIndex)
        })
      }

      // Create new UTXOs from outputs
      if (tx.outputs) {
        tx.outputs.forEach((output, index) => {
          this.utxoPool.addUTXO({
            txId: tx.id,
            outputIndex: index,
            address: output.address,
            amount: output.amount,
            spent: false,
            shielded: output.shielded,
            commitment: tx.commitment,
          })
        })
      }
    })
  }

  getBalance(address: string): number {
    return this.utxoPool.getBalance(address)
  }

  getShieldedPoolStats(): { size: number; totalValue: number } {
    return {
      size: this.shieldedPool.getPoolSize(),
      totalValue: this.utxoPool.getShieldedPoolSize(),
    }
  }

  getNetworkStats(): {
    nodes: number
    difficulty: number
    hashrate: number
    blockTime: number
    mempoolSize: number
  } {
    return {
      nodes: this.network.getNodes().length,
      difficulty: this.difficulty,
      hashrate: Math.pow(2, this.difficulty) / this.blockTime,
      blockTime: this.blockTime,
      mempoolSize: this.mempool.size(),
    }
  }

  getBlockchainStats(): {
    height: number
    totalTransactions: number
    shieldedTransactions: number
    transparentTransactions: number
    totalSupply: number
    circulatingSupply: number
  } {
    let totalTx = 0
    let shieldedTx = 0

    this.chain.forEach((block) => {
      totalTx += block.transactions.length
      shieldedTx += block.transactions.filter((tx) => tx.shielded).length
    })

    return {
      height: this.chain.length,
      totalTransactions: totalTx,
      shieldedTransactions: shieldedTx,
      transparentTransactions: totalTx - shieldedTx,
      totalSupply: this.chain.length * this.miningReward,
      circulatingSupply: this.chain.length * this.calculateMiningReward(),
    }
  }

  registerValidator(address: string, stake: number): boolean {
    return this.consensus.registerValidator(address, stake)
  }

  getValidators() {
    return this.consensus.getValidators()
  }

  getMempoolTransactions(): Transaction[] {
    return this.mempool.getAllTransactions()
  }

  getNetworkNodes() {
    return this.network.getNodes()
  }
}
