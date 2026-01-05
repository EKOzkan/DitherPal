import { Handle, Position } from 'reactflow'

/**
 * OutputNode - The final output of the graph
 */
export function OutputNode({ data }) {
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

  const indicatorStyle = {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: data?.hasOutput ? '#00ff00' : '#333',
    border: '2px solid #ffffff',
    boxShadow: data?.hasOutput ? '0 0 10px #00ff00' : 'none'
  }

  const labelStyle = {
    fontSize: '0.55rem',
    color: data?.hasOutput ? '#00ff00' : '#888'
  }

  return (
    <div style={baseStyle}>
      <div style={headerStyle}>Final Output</div>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          background: '#00ff00',
          border: '1px solid #ffffff',
          top: '50%'
        }}
      />
      <div style={indicatorStyle} />
      <div style={labelStyle}>
        {data?.hasOutput ? 'Ready' : 'Waiting'}
      </div>
    </div>
  )
}
