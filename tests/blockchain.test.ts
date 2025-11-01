import { Zolana } from "../lib/blockchain/zolana"
import { Wallet } from "../lib/blockchain/wallet"

describe("Zolana Blockchain", () => {
  let blockchain: Zolana
  let wallet1: Wallet
  let wallet2: Wallet

  beforeEach(() => {
    blockchain = new Zolana()
    wallet1 = new Wallet()
    wallet2 = new Wallet()
  })

  test("should create genesis block", () => {
    expect(blockchain.chain.length).toBe(1)
    expect(blockchain.chain[0].index).toBe(0)
  })

  test("should create transparent transaction", () => {
    const tx = blockchain.createTransaction(wallet1.address, wallet2.address, 100, 0.001)
    expect(tx).not.toBeNull()
    expect(tx?.shielded).toBe(false)
  })

  test("should create shielded transaction", () => {
    const tx = blockchain.createShieldedTransaction(
      wallet1.address,
      wallet2.address,
      50,
      wallet1.getPrivateKey(),
      0.001,
    )
    expect(tx).not.toBeNull()
    expect(tx?.shielded).toBe(true)
    expect(tx?.zkProof).toBeDefined()
    expect(tx?.nullifier).toBeDefined()
  })

  test("should add transaction to mempool", () => {
    const tx = blockchain.createTransaction(wallet1.address, wallet2.address, 100, 0.001)
    if (tx) {
      const added = blockchain.addTransaction(tx)
      expect(added).toBe(true)
    }
  })

  test("should register validator", () => {
    const registered = blockchain.registerValidator(wallet1.address, 10000)
    expect(registered).toBe(true)
  })

  test("should get blockchain stats", () => {
    const stats = blockchain.getBlockchainStats()
    expect(stats.height).toBe(1)
    expect(stats.totalTransactions).toBe(0)
  })

  test("should verify chain validity", () => {
    expect(blockchain.isChainValid()).toBe(true)
  })

  test("wallet should generate addresses", () => {
    expect(wallet1.address).toMatch(/^zol/)
    expect(wallet1.getShieldedAddress()).toMatch(/^zs/)
  })

  test("wallet should derive child wallets", () => {
    const child = wallet1.deriveChild(0)
    expect(child.address).not.toBe(wallet1.address)
  })

  test("wallet should export and import", () => {
    const exported = wallet1.export()
    const imported = Wallet.import(exported)
    expect(imported.address).toBe(wallet1.address)
  })
})
