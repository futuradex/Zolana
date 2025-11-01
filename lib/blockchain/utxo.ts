// UTXO (Unspent Transaction Output) model similar to Bitcoin/Zcash
export interface UTXO {
  txId: string
  outputIndex: number
  address: string
  amount: number
  spent: boolean
  shielded: boolean
  commitment?: string // For shielded outputs
}

export interface TransactionInput {
  txId: string
  outputIndex: number
  signature: string
  publicKey: string
}

export interface TransactionOutput {
  address: string
  amount: number
  shielded: boolean
  commitment?: string
}

export class UTXOPool {
  private utxos: Map<string, UTXO> = new Map()

  private getUTXOKey(txId: string, outputIndex: number): string {
    return `${txId}:${outputIndex}`
  }

  addUTXO(utxo: UTXO): void {
    const key = this.getUTXOKey(utxo.txId, utxo.outputIndex)
    this.utxos.set(key, utxo)
  }

  getUTXO(txId: string, outputIndex: number): UTXO | undefined {
    const key = this.getUTXOKey(txId, outputIndex)
    return this.utxos.get(key)
  }

  spendUTXO(txId: string, outputIndex: number): boolean {
    const utxo = this.getUTXO(txId, outputIndex)
    if (!utxo || utxo.spent) {
      return false
    }
    utxo.spent = true
    return true
  }

  getUTXOsForAddress(address: string): UTXO[] {
    return Array.from(this.utxos.values()).filter((utxo) => utxo.address === address && !utxo.spent)
  }

  getBalance(address: string): number {
    return this.getUTXOsForAddress(address).reduce((sum, utxo) => sum + utxo.amount, 0)
  }

  // Get shielded pool size (total value in shielded transactions)
  getShieldedPoolSize(): number {
    return Array.from(this.utxos.values())
      .filter((utxo) => utxo.shielded && !utxo.spent)
      .reduce((sum, utxo) => sum + utxo.amount, 0)
  }
}
