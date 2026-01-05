import React, { useCallback, useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'
import { InputNode } from './nodes/InputNode'
import { EffectNode } from './nodes/EffectNode'
import { OutputNode } from './nodes/OutputNode'
import { GraphExecutor } from './graphExecutor'
import './GraphEditor.css'

// Register node types
const nodeTypes = {
  input: InputNode,
  effect: EffectNode,
  output: OutputNode
}

// Default initial nodes
const getInitialNodes = () => [
  {
    id: 'input-1',
    type: 'input',
    position: { x: 50, y: 150 },
    data: {}
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 550, y: 150 },
    data: { hasOutput: false }
  }
]

/**
 * GraphEditor - React Flow-based node graph editor
 */
export function GraphEditor({ originalImage, onOutputChange }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes())
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [validationErrors, setValidationErrors] = useState([])
  const [executionTime, setExecutionTime] = useState(null)
  const [isValid, setIsValid] = useState(false)

  // Update input node with current image
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'input') {
          return {
            ...node,
            data: { ...node.data, image: originalImage }
          }
        }
        return node
      })
    )
  }, [originalImage, setNodes])

  // Execute graph when nodes or edges change
  const executeGraph = useCallback(async () => {
    if (!originalImage) return

    const executor = new GraphExecutor(nodes, edges)
    const validation = executor.validate()

    setIsValid(validation.valid)
    setValidationErrors(validation.errors)

    if (!validation.valid) {
      // Clear output indicator
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === 'output') {
            return { ...node, data: { ...node.data, hasOutput: false } }
          }
          return node
        })
      )
      return
    }

    try {
      const startTime = performance.now()

      // Execute graph
      const output = await executor.execute(originalImage)

      const endTime = performance.now()
      setExecutionTime((endTime - startTime).toFixed(0))

      // Update output node
      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === 'output') {
            return { ...node, data: { ...node.data, hasOutput: true } }
          }
          return node
        })
      )

      // Send output to parent
      if (onOutputChange) {
        onOutputChange(output)
      }
    } catch (error) {
      console.error('Graph execution error:', error)
      setValidationErrors([error.message])

      setNodes((nds) =>
        nds.map((node) => {
          if (node.type === 'output') {
            return { ...node, data: { ...node.data, hasOutput: false } }
          }
          return node
        })
      )
    }
  }, [nodes, edges, originalImage, setNodes, onOutputChange])

  // Debounced execution
  useEffect(() => {
    const timer = setTimeout(() => {
      executeGraph()
    }, 200)

    return () => clearTimeout(timer)
  }, [executeGraph])

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          { ...params, markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 } },
          eds
        )
      ),
    [setEdges]
  )

  // Add new node
  const addNode = useCallback(
    (type) => {
      const id = `${type}-${Date.now()}`
      const newNode = {
        id,
        type,
        position: {
          x: 300 + Math.random() * 50,
          y: 50 + Math.random() * 200
        },
        data: {}
      }
      setNodes((nds) => [...nds, newNode])
    },
    [setNodes]
  )

  // Handle algorithm change in effect node
  const handleAlgorithmChange = useCallback((nodeId, algorithm) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, algorithm } }
          : node
      )
    )
  }, [setNodes])

  // Handle parameter change in effect node
  const handleParamChange = useCallback((nodeId, paramName, value) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const params = node.data.params || {}
          return {
            ...node,
            data: {
              ...node.data,
              params: { ...params, [paramName]: value }
            }
          }
        }
        return node
      })
    )
  }, [setNodes])

  // Update node data with callbacks
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.type === 'effect') {
          return {
            ...node,
            data: {
              ...node.data,
              onAlgorithmChange: handleAlgorithmChange,
              onParamChange: handleParamChange
            }
          }
        }
        return node
      })
    )
  }, [setNodes, handleAlgorithmChange, handleParamChange])

  const containerStyle = {
    width: '100%',
    height: '100%',
    background: '#0a0a0a',
    border: '2px solid',
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
    position: 'relative'
  }

  const toolbarStyle = {
    position: 'absolute',
    top: '10px',
    left: '10px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: '#000000',
    padding: '8px',
    border: '2px solid',
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff'
  }

  const buttonStyle = {
    background: '#000000',
    border: '2px solid',
    borderTopColor: '#ffffff',
    borderLeftColor: '#ffffff',
    borderBottomColor: '#808080',
    borderRightColor: '#808080',
    color: '#00ff00',
    padding: '6px 12px',
    fontSize: '0.6rem',
    fontFamily: 'Silkscreen, monospace',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }

  const statsStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1000,
    background: '#000000',
    padding: '8px',
    border: '2px solid',
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
    fontSize: '0.55rem',
    fontFamily: 'Silkscreen, monospace',
    color: '#00ff00'
  }

  const validationStyle = {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    zIndex: 1000,
    background: '#000000',
    padding: '8px',
    border: '2px solid',
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
    fontSize: '0.55rem',
    fontFamily: 'Silkscreen, monospace',
    color: isValid ? '#00ff00' : '#ff0000',
    maxWidth: '300px'
  }

  return (
    <div style={containerStyle}>
      <div style={toolbarStyle}>
        <button style={buttonStyle} onClick={() => addNode('effect')}>
          + Effect
        </button>
        <button style={buttonStyle} onClick={() => addNode('input')}>
          + Input
        </button>
        <button style={buttonStyle} onClick={() => addNode('output')}>
          + Output
        </button>
      </div>

      <div style={statsStyle}>
        <div>Nodes: {nodes.length}</div>
        <div>Edges: {edges.length}</div>
        {executionTime && <div>Time: {executionTime}ms</div>}
      </div>

      {validationErrors.length > 0 && (
        <div style={validationStyle}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {isValid ? '✓ Valid' : '✗ Invalid'}
          </div>
          {validationErrors.map((error, idx) => (
            <div key={idx}>• {error}</div>
          ))}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{
          style: { stroke: '#00ff00', strokeWidth: 2 },
          animated: false
        }}
      >
        <Background color="#1a1a1a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor="#000000"
          maskColor="rgba(0, 255, 0, 0.1)"
          style={{
            background: '#000000',
            border: '1px solid #00ff00'
          }}
        />
      </ReactFlow>
    </div>
  )
}
