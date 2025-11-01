import crypto from "crypto"
import { PrivacyLayer } from "./privacy"

export class Wallet {
  public address: string
  private privateKey: string
  private viewingKey: string
  private shieldedAddress: string

  constructor(seed?: string) {
    if (seed) {
      this.privateKey = crypto.createHash("sha256").update(seed).digest("hex")
    } else {
      this.privateKey = crypto.randomBytes(32).toString("hex")
    }

    this.address = this.generateAddress()
    this.viewingKey = PrivacyLayer.generateViewingKey(this.privateKey)
    this.shieldedAddress = this.generateShieldedAddress()
  }

  private generateAddress(): string {
    return "zol" + crypto.createHash("sha256").update(this.privateKey).digest("hex").substring(0, 40)
  }

  private generateShieldedAddress(): string {
    return (
      "zs" +
      crypto
        .createHash("sha256")
        .update(this.privateKey + "shielded")
        .digest("hex")
        .substring(0, 40)
    )
  }

  getPrivateKey(): string {
    return this.privateKey
  }

  getViewingKey(): string {
    return this.viewingKey
  }

  getShieldedAddress(): string {
    return this.shieldedAddress
  }

  sign(data: string): string {
    return crypto.createHmac("sha256", this.privateKey).update(data).digest("hex")
  }

  static verify(data: string, signature: string, publicKey: string): boolean {
    const expectedSig = crypto.createHmac("sha256", publicKey).update(data).digest("hex")
    return signature === expectedSig
  }

  deriveChild(index: number): Wallet {
    const childSeed = crypto
      .createHash("sha256")
      .update(this.privateKey + index.toString())
      .digest("hex")
    return new Wallet(childSeed)
  }

  export(): string {
    return JSON.stringify({
      address: this.address,
      shieldedAddress: this.shieldedAddress,
      privateKey: this.privateKey,
      viewingKey: this.viewingKey,
    })
  }

  static import(json: string): Wallet {
    const data = JSON.parse(json)
    const wallet = new Wallet(data.privateKey)
    return wallet
  }
}
