import crypto from "crypto"
import type { Block } from "./block"

// P2P Network simulation for blockchain nodes
export interface Node {
  id: string
  address: string
  port: number
  peers: Set<string>
  lastSeen: number
}

export interface NetworkMessage {
  type: "block" | "transaction" | "peer_discovery" | "sync_request"
  data: any
  from: string
  timestamp: number
  signature: string
}

export class P2PNetwork {
  private nodes: Map<string, Node> = new Map()
  private messageQueue: NetworkMessage[] = []
  private maxPeers = 8
  private nodeId: string

  constructor() {
    this.nodeId = crypto.randomBytes(16).toString("hex")
  }

  // Register a new node in the network
  registerNode(address: string, port: number): string {
    const nodeId = crypto.randomBytes(16).toString("hex")
    const node: Node = {
      id: nodeId,
      address,
      port,
      peers: new Set(),
      lastSeen: Date.now(),
    }
    this.nodes.set(nodeId, node)
    return nodeId
  }

  // Connect two nodes as peers
  connectPeers(nodeId1: string, nodeId2: string): boolean {
    const node1 = this.nodes.get(nodeId1)
    const node2 = this.nodes.get(nodeId2)

    if (!node1 || !node2) {
      return false
    }

    if (node1.peers.size >= this.maxPeers || node2.peers.size >= this.maxPeers) {
      return false
    }

    node1.peers.add(nodeId2)
    node2.peers.add(nodeId1)
    return true
  }

  // Broadcast a message to all peers
  broadcast(message: NetworkMessage): void {
    const sender = this.nodes.get(message.from)
    if (!sender) return

    sender.peers.forEach((peerId) => {
      this.messageQueue.push({ ...message, from: sender.id })
    })
  }

  // Propagate a block through the network
  propagateBlock(block: Block, fromNodeId: string): void {
    const message: NetworkMessage = {
      type: "block",
      data: block,
      from: fromNodeId,
      timestamp: Date.now(),
      signature: this.signMessage(JSON.stringify(block)),
    }
    this.broadcast(message)
  }

  // Get all connected nodes
  getNodes(): Node[] {
    return Array.from(this.nodes.values())
  }

  // Get peers for a specific node
  getPeers(nodeId: string): Node[] {
    const node = this.nodes.get(nodeId)
    if (!node) return []

    return Array.from(node.peers)
      .map((peerId) => this.nodes.get(peerId))
      .filter((peer): peer is Node => peer !== undefined)
  }

  // Simulate network latency
  getNetworkLatency(): number {
    return Math.random() * 100 + 50 // 50-150ms
  }

  private signMessage(data: string): string {
    return crypto
      .createHash("sha256")
      .update(data + this.nodeId)
      .digest("hex")
  }

  // Process pending messages
  processMessages(): NetworkMessage[] {
    const messages = [...this.messageQueue]
    this.messageQueue = []
    return messages
  }
}
