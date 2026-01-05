import {
  floydSteinberg,
  floydSteinbergSerpentine,
  falseFloydSteinberg,
  jarvisJudiceNinke,
  atkinson,
  stucki,
  burkes,
  sierra,
  twoRowSierra,
  sierraLite,
  bayerOrdered,
  bayerOrdered4x4,
  bayerOrdered16x16,
  randomOrdered,
  bitTone,
  crossPlus,
  asciiArt,
  halftoneCircles,
  grain,
  tonal,
  threshold,
  bloom,
  contrast
} from '../operations/algorithms'

// Map algorithm names to functions
const ALGORITHM_MAP = {
  floydSteinberg,
  floydSteinbergSerpentine,
  falseFloydSteinberg,
  jarvisJudiceNinke,
  atkinson,
  stucki,
  burkes,
  sierra,
  twoRowSierra,
  sierraLite,
  bayerOrdered,
  bayerOrdered4x4,
  bayerOrdered16x16,
  randomOrdered,
  bitTone,
  crossPlus,
  asciiArt,
  halftoneCircles,
  grain,
  tonal,
  threshold,
  bloom,
  contrast
}

/**
 * GraphExecutor - Processes images through a node graph
 */
export class GraphExecutor {
  constructor(nodes, edges) {
    this.nodes = nodes
    this.edges = edges
    this.cache = new Map() // Cache intermediate results by node ID
  }

  /**
   * Validate the graph structure
   */
  validate() {
    const errors = []

    // Check for input node
    const hasInput = this.nodes.some(n => n.type === 'input')
    if (!hasInput) {
      errors.push('Graph must have at least one Input node')
    }

    // Check for output node
    const hasOutput = this.nodes.some(n => n.type === 'output')
    if (!hasOutput) {
      errors.push('Graph must have at least one Output node')
    }

    // Check for cycles
    if (this.hasCycle()) {
      errors.push('Graph contains cycles (nodes cannot loop back to themselves)')
    }

    // Check for disconnected effect nodes
    const connectedNodeIds = new Set()
    this.edges.forEach(edge => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })

    const effectNodes = this.nodes.filter(n => n.type === 'effect')
    effectNodes.forEach(node => {
      const hasInput = this.edges.some(e => e.target === node.id)
      const hasOutput = this.edges.some(e => e.source === node.id)

      if (!hasInput || !hasOutput) {
        errors.push(`Effect node "${node.data?.label || node.id}" is not properly connected`)
      }
    })

    // Check output node has input
    const outputNodes = this.nodes.filter(n => n.type === 'output')
    outputNodes.forEach(node => {
      const hasInput = this.edges.some(e => e.target === node.id)
      if (!hasInput) {
        errors.push('Output node must have an input connection')
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Detect cycles in the graph using DFS
   */
  hasCycle() {
    const visited = new Set()
    const recursionStack = new Set()

    const hasCycleDFS = (nodeId) => {
      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingEdges = this.edges.filter(e => e.source === nodeId)
      for (const edge of outgoingEdges) {
        const neighbor = edge.target

        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) {
            return true
          }
        } else if (recursionStack.has(neighbor)) {
          return true
        }
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of this.nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Get nodes in topological order (dependencies first)
   */
  getTopologicalOrder() {
    const order = []
    const visited = new Set()
    const tempVisited = new Set()

    const visit = (nodeId) => {
      if (tempVisited.has(nodeId)) {
        return // Cycle detected, skip
      }
      if (visited.has(nodeId)) {
        return
      }

      tempVisited.add(nodeId)

      // Visit dependencies first (incoming edges)
      const incomingEdges = this.edges.filter(e => e.target === nodeId)
      for (const edge of incomingEdges) {
        visit(edge.source)
      }

      tempVisited.delete(nodeId)
      visited.add(nodeId)
      order.push(nodeId)
    }

    for (const node of this.nodes) {
      visit(node.id)
    }

    return order
  }

  /**
   * Get input for a node (from cache or compute)
   */
  async getNodeInput(nodeId) {
    const incomingEdge = this.edges.find(e => e.target === nodeId)
    if (!incomingEdge) {
      throw new Error(`Node ${nodeId} has no input`)
    }

    const sourceNodeId = incomingEdge.source

    if (this.cache.has(sourceNodeId)) {
      return this.cache.get(sourceNodeId)
    }

    throw new Error(`Source node ${sourceNodeId} not computed yet`)
  }

  /**
   * Execute a single node
   */
  async executeNode(node, inputImageData) {
    if (node.type === 'input') {
      return inputImageData
    }

    if (node.type === 'output') {
      return inputImageData
    }

    if (node.type === 'effect') {
      const algorithm = node.data?.algorithm
      const params = node.data?.params || {}

      if (!algorithm || !ALGORITHM_MAP[algorithm]) {
        throw new Error(`Unknown algorithm: ${algorithm}`)
      }

      // Clone the input image data to avoid mutations
      const clonedData = new ImageData(
        new Uint8ClampedArray(inputImageData.data),
        inputImageData.width,
        inputImageData.height
      )

      // Apply algorithm with parameters
      let result = ALGORITHM_MAP[algorithm](clonedData)

      // Apply parameters if they exist
      if (algorithm === 'threshold' && params.threshold !== undefined) {
        // Re-run threshold with custom value
        result = this.applyCustomThreshold(clonedData, params.threshold)
      }

      if (algorithm === 'bloom' && params.bloom !== undefined) {
        result = this.applyCustomBloom(clonedData, params.bloom)
      }

      return result
    }

    throw new Error(`Unknown node type: ${node.type}`)
  }

  /**
   * Apply threshold with custom value
   */
  applyCustomThreshold(imageData, threshold) {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    for (let i = 0; i < result.data.length; i += 4) {
      const brightness = (result.data[i] + result.data[i + 1] + result.data[i + 2]) / 3
      const val = brightness < threshold ? 0 : 255
      result.data[i] = val
      result.data[i + 1] = val
      result.data[i + 2] = val
    }

    return result
  }

  /**
   * Apply bloom with custom intensity
   */
  applyCustomBloom(imageData, intensity) {
    const width = imageData.width
    const height = imageData.height
    const src = imageData.data

    // Create working copies
    const workingData = new Uint8ClampedArray(src)
    const tempData = new Uint8ClampedArray(src.length)
    const resultData = new Uint8ClampedArray(src.length)

    const clamp = (v) => Math.max(0, Math.min(255, v))

    // Apply Gaussian blur approximation
    const blurPass = (source, dest) => {
      const radius = 3
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0, weight = 0

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx
              const ny = y + dy

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const idx = (ny * width + nx) * 4
                const w = 1 / (Math.abs(dx) + Math.abs(dy) + 1)
                r += source[idx] * w
                g += source[idx + 1] * w
                b += source[idx + 2] * w
                weight += w
              }
            }
          }

          const idx = (y * width + x) * 4
          dest[idx] = clamp(r / weight)
          dest[idx + 1] = clamp(g / weight)
          dest[idx + 2] = clamp(b / weight)
          dest[idx + 3] = 255
        }
      }
    }

    // Multiple blur passes
    const passes = 3
    for (let pass = 0; pass < passes; pass++) {
      if (pass % 2 === 0) {
        blurPass(workingData, tempData)
      } else {
        blurPass(tempData, workingData)
      }
    }

    // Enhance bright areas
    for (let i = 0; i < src.length; i += 4) {
      const brightness = (workingData[i] + workingData[i + 1] + workingData[i + 2]) / 3
      if (brightness > 128) {
        workingData[i] = clamp(workingData[i] * 1.2)
        workingData[i + 1] = clamp(workingData[i + 1] * 1.2)
        workingData[i + 2] = clamp(workingData[i + 2] * 1.2)
      }
    }

    // Blend with original using screen blend mode
    const bloomStrength = intensity
    for (let i = 0; i < src.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const a = src[i + j] / 255
        const b = (workingData[i + j] * bloomStrength) / 255
        resultData[i + j] = clamp((1 - (1 - a) * (1 - b)) * 255)
      }
      resultData[i + 3] = 255
    }

    return new ImageData(resultData, width, height)
  }

  /**
   * Execute the graph and return the final output
   */
  async execute(inputImageData) {
    // Clear cache
    this.cache.clear()

    // Validate
    const validation = this.validate()
    if (!validation.valid) {
      throw new Error(`Graph validation failed:\n${validation.errors.join('\n')}`)
    }

    // Get execution order
    const order = this.getTopologicalOrder()

    // Find input nodes
    const inputNodes = this.nodes.filter(n => n.type === 'input')

    // Execute nodes in order
    for (const nodeId of order) {
      const node = this.nodes.find(n => n.id === nodeId)
      if (!node) continue

      if (node.type === 'input') {
        this.cache.set(nodeId, inputImageData)
      } else {
        const input = await this.getNodeInput(nodeId)
        const output = await this.executeNode(node, input)
        this.cache.set(nodeId, output)
      }
    }

    // Return output from first output node
    const outputNode = this.nodes.find(n => n.type === 'output')
    if (outputNode && this.cache.has(outputNode.id)) {
      return this.cache.get(outputNode.id)
    }

    throw new Error('No output found')
  }

  /**
   * Get cached output for a specific node (for debugging)
   */
  getNodeOutput(nodeId) {
    return this.cache.get(nodeId)
  }
}
