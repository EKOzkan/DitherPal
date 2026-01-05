import { Handle, Position } from 'reactflow'
import { useEffect, useRef, useState } from 'react'
import './InputNode.css'

/**
 * InputNode - Provides the input image to the graph
 */
export function InputNode({ data }) {
  const canvasRef = useRef(null)
  const [hasImage, setHasImage] = useState(false)

  useEffect(() => {
    if (data?.image && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      // Set canvas size to fit in node
      const maxSize = 80
      let width = data.image.width
      let height = data.image.height

      if (width > height) {
        if (width > maxSize) {
          height = (height / width) * maxSize
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw image thumbnail
      ctx.putImageData(data.image, 0, 0)

      setHasImage(true)
    } else {
      setHasImage(false)
    }
  }, [data?.image])

  const baseStyle = {
    padding: '10px',
    background: '#000000',
    border: '2px solid',
    borderTopColor: '#808080',
    borderLeftColor: '#808080',
    borderBottomColor: '#ffffff',
    borderRightColor: '#ffffff',
    fontFamily: 'Silkscreen, monospace',
    fontSize: '0.7rem',
    color: '#ffffff',
    minWidth: '150px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  }

  const headerStyle = {
    fontSize: '0.65rem',
    color: '#00ff00',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: '100%',
    textAlign: 'center'
  }

  const canvasStyle = {
    border: '1px solid #00ff00',
    background: hasImage ? 'transparent' : '#1a1a1a'
  }

  const placeholderStyle = {
    fontSize: '0.5rem',
    color: '#666',
    textAlign: 'center',
    padding: '20px 10px'
  }

  return (
    <div style={baseStyle}>
      <div style={headerStyle}>Image Input</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '12px',
          height: '12px',
          background: '#00ff00',
          border: '1px solid #ffffff',
          top: '50%'
        }}
      />
      {hasImage ? (
        <canvas ref={canvasRef} style={canvasStyle} />
      ) : (
        <div style={placeholderStyle}>No image loaded</div>
      )}
      {hasImage && (
        <div style={{ fontSize: '0.55rem', color: '#888' }}>
          {data?.image?.width}×{data?.image?.height}
        </div>
      )}
    </div>
  )
}
