import type { Transaction } from "./block"

// Transaction memory pool for pending transactions
export class Mempool {
  private transactions: Map<string, Transaction> = new Map()
  private maxSize = 1000
  private minFee = 0.0001

  addTransaction(transaction: Transaction): boolean {
    // Check if mempool is full
    if (this.transactions.size >= this.maxSize) {
      return false
    }

    // Check if transaction already exists
    if (this.transactions.has(transaction.id)) {
      return false
    }

    // Add transaction
    this.transactions.set(transaction.id, transaction)
    return true
  }

  removeTransaction(txId: string): void {
    this.transactions.delete(txId)
  }

  getTransaction(txId: string): Transaction | undefined {
    return this.transactions.get(txId)
  }

  getAllTransactions(): Transaction[] {
    return Array.from(this.transactions.values())
  }

  // Get transactions sorted by fee (for miners to prioritize)
  getTransactionsByFee(limit?: number): Transaction[] {
    const sorted = Array.from(this.transactions.values()).sort((a, b) => {
      const feeA = (a as any).fee || 0
      const feeB = (b as any).fee || 0
      return feeB - feeA
    })

    return limit ? sorted.slice(0, limit) : sorted
  }

  clear(): void {
    this.transactions.clear()
  }

  size(): number {
    return this.transactions.size
  }

  // Remove transactions that are included in a block
  removeTransactions(txIds: string[]): void {
    txIds.forEach((id) => this.removeTransaction(id))
  }
}
