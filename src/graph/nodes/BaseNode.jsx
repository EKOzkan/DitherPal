import { Handle, Position } from 'reactflow'

/**
 * BaseNode - A reusable base component for graph nodes
 */
export function BaseNode({ type, label, children, handles }) {
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
    minWidth: '150px'
  }

  const headerStyle = {
    fontSize: '0.65rem',
    marginBottom: '8px',
    color: '#00ff00',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  }

  const contentStyle = {
    marginTop: '8px'
  }

  return (
    <div style={baseStyle}>
      <div style={headerStyle}>{label}</div>
      {handles?.input && (
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '12px',
            height: '12px',
            background: '#00ff00',
            border: '1px solid #ffffff'
          }}
        />
      )}
      <div style={contentStyle}>{children}</div>
      {handles?.output && (
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '12px',
            height: '12px',
            background: '#00ff00',
            border: '1px solid #ffffff'
          }}
        />
      )}
    </div>
  )
}
