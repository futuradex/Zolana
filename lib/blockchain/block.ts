import crypto from "crypto"
import { MerkleTree } from "./merkle"

export interface Transaction {
  id: string
  from: string
  to: string
  amount: number
  timestamp: number
  signature?: string
  fee?: number
  // Privacy features inspired by Zcash
  shielded: boolean
  zkProof?: string
  nullifier?: string
  commitment?: string
  rangeProof?: string
  encryptedNote?: string
  // UTXO model
  inputs?: Array<{ txId: string; outputIndex: number; signature: string }>
  outputs?: Array<{ address: string; amount: number; shielded: boolean }>
}

export class Block {
  public hash: string
  public nonce = 0
  public merkleRoot: string

  constructor(
    public index: number,
    public timestamp: number,
    public transactions: Transaction[],
    public previousHash = "",
    public validator?: string,
    public difficulty?: number,
  ) {
    this.merkleRoot = this.calculateMerkleRoot()
    this.hash = this.calculateHash()
  }

  calculateMerkleRoot(): string {
    if (this.transactions.length === 0) {
      return crypto.createHash("sha256").update("empty").digest("hex")
    }

    const txHashes = this.transactions.map((tx) => JSON.stringify(tx))
    const merkleTree = new MerkleTree(txHashes)
    return merkleTree.getRoot()
  }

  calculateHash(): string {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          this.merkleRoot +
          this.nonce +
          (this.validator || "") +
          (this.difficulty || ""),
      )
      .digest("hex")
  }

  // Proof of Work (simplified)
  mineBlock(difficulty: number): void {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++
      this.hash = this.calculateHash()
    }
  }

  getBlockSize(): number {
    return Buffer.from(JSON.stringify(this)).length
  }

  getTransactionStats(): { total: number; shielded: number; transparent: number } {
    const shielded = this.transactions.filter((tx) => tx.shielded).length
    return {
      total: this.transactions.length,
      shielded,
      transparent: this.transactions.length - shielded,
    }
  }
}
