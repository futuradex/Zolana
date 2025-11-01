import type { Block } from "./block"

export interface Validator {
  address: string
  stake: number
  reputation: number
  blocksValidated: number
  lastActive: number
}

export class ConsensusEngine {
  private validators: Map<string, Validator> = new Map()
  private minStake = 1000
  private slashingPenalty = 0.1

  // Proof of Stake validator selection using weighted random selection
  selectValidator(): string | null {
    const activeValidators = Array.from(this.validators.values()).filter(
      (v) => v.stake >= this.minStake && Date.now() - v.lastActive < 86400000, // Active in last 24h
    )

    if (activeValidators.length === 0) {
      return null
    }

    // Weight by stake and reputation
    const totalWeight = activeValidators.reduce((sum, v) => sum + v.stake * v.reputation, 0)
    let random = Math.random() * totalWeight

    for (const validator of activeValidators) {
      random -= validator.stake * validator.reputation
      if (random <= 0) {
        return validator.address
      }
    }

    return activeValidators[0].address
  }

  // Register a validator with stake
  registerValidator(address: string, stake: number): boolean {
    if (stake < this.minStake) {
      return false
    }

    this.validators.set(address, {
      address,
      stake,
      reputation: 1.0,
      blocksValidated: 0,
      lastActive: Date.now(),
    })

    return true
  }

  // Increase validator stake
  addStake(address: string, amount: number): boolean {
    const validator = this.validators.get(address)
    if (!validator) {
      return false
    }

    validator.stake += amount
    return true
  }

  // Slash validator for misbehavior
  slashValidator(address: string): void {
    const validator = this.validators.get(address)
    if (!validator) return

    validator.stake *= 1 - this.slashingPenalty
    validator.reputation *= 0.5

    if (validator.stake < this.minStake) {
      this.validators.delete(address)
    }
  }

  // Reward validator for successful block validation
  rewardValidator(address: string, reward: number): void {
    const validator = this.validators.get(address)
    if (!validator) return

    validator.stake += reward
    validator.blocksValidated++
    validator.reputation = Math.min(validator.reputation * 1.01, 2.0)
    validator.lastActive = Date.now()
  }

  // Verify block meets consensus requirements
  verifyBlock(block: Block, expectedValidator?: string): boolean {
    // Check if block was validated by registered validator
    if (block.validator && expectedValidator) {
      return block.validator === expectedValidator
    }

    // For PoW blocks, verify difficulty
    if (block.difficulty && block.nonce) {
      const hash = block.calculateHash()
      const target = "0".repeat(block.difficulty)
      return hash.substring(0, block.difficulty) === target
    }

    return true
  }

  getValidators(): Validator[] {
    return Array.from(this.validators.values())
  }

  getTotalStake(): number {
    return Array.from(this.validators.values()).reduce((sum, v) => sum + v.stake, 0)
  }
}
