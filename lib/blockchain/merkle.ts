import crypto from "crypto"

// Merkle Tree implementation for efficient transaction verification
export class MerkleTree {
  private leaves: string[]
  private layers: string[][]

  constructor(data: string[]) {
    this.leaves = data.map((item) => this.hash(item))
    this.layers = this.buildTree()
  }

  private hash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex")
  }

  private buildTree(): string[][] {
    const layers: string[][] = [this.leaves]

    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1]
      const nextLayer: string[] = []

      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i]
        const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left
        nextLayer.push(this.hash(left + right))
      }

      layers.push(nextLayer)
    }

    return layers
  }

  getRoot(): string {
    return this.layers[this.layers.length - 1][0]
  }

  getProof(index: number): { position: "left" | "right"; data: string }[] {
    const proof: { position: "left" | "right"; data: string }[] = []
    let currentIndex = index

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i]
      const isRightNode = currentIndex % 2 === 1
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1

      if (siblingIndex < layer.length) {
        proof.push({
          position: isRightNode ? "left" : "right",
          data: layer[siblingIndex],
        })
      }

      currentIndex = Math.floor(currentIndex / 2)
    }

    return proof
  }

  static verify(leaf: string, proof: { position: "left" | "right"; data: string }[], root: string): boolean {
    let hash = crypto.createHash("sha256").update(leaf).digest("hex")

    for (const node of proof) {
      const data = node.position === "left" ? node.data + hash : hash + node.data
      hash = crypto.createHash("sha256").update(data).digest("hex")
    }

    return hash === root
  }
}
