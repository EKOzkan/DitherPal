/* eslint-disable react/prop-types */
import { Handle, Position } from 'reactflow'
import { useState } from 'react'

const ALGORITHMS = [
  { id: 'floydSteinberg', label: 'Floyd-Steinberg' },
  { id: 'floydSteinbergSerpentine', label: 'Floyd-Steinberg (Serpentine)' },
  { id: 'falseFloydSteinberg', label: 'False Floyd-Steinberg' },
  { id: 'jarvisJudiceNinke', label: 'Jarvis-Judice-Ninke' },
  { id: 'atkinson', label: 'Atkinson' },
  { id: 'stucki', label: 'Stucki' },
  { id: 'burkes', label: 'Burkes' },
  { id: 'sierra', label: 'Sierra' },
  { id: 'twoRowSierra', label: 'Two-Row Sierra' },
  { id: 'sierraLite', label: 'Sierra Lite' },
  { id: 'bayerOrdered', label: 'Bayer Ordered (8x8)' },
  { id: 'bayerOrdered4x4', label: 'Bayer Ordered (4x4)' },
  { id: 'bayerOrdered16x16', label: 'Bayer Ordered (16x16)' },
  { id: 'randomOrdered', label: 'Random Ordered' },
  { id: 'bitTone', label: 'Bit-Tone' },
  { id: 'crossPlus', label: 'Cross-Plus' },
  { id: 'asciiArt', label: 'ASCII Art' },
  { id: 'halftoneCircles', label: 'Halftone Circles' },
  { id: 'grain', label: 'Grain' },
  { id: 'tonal', label: 'Tonal' },
  { id: 'threshold', label: 'Threshold' },
  { id: 'bloom', label: 'Bloom' },
  { id: 'contrast', label: 'Contrast' }
]

/**
 * EffectNode - Applies an effect/algorithm to the image
 */
export function EffectNode({ data }) {
  const [algorithm, setAlgorithm] = useState(data?.algorithm || 'floydSteinberg')

  const handleAlgorithmChange = (e) => {
    const newAlgorithm = e.target.value
    setAlgorithm(newAlgorithm)
    if (data?.onAlgorithmChange) {
      data.onAlgorithmChange(data.id, newAlgorithm)
    }
  }

  const handleParamChange = (paramName, value) => {
    if (data?.onParamChange) {
      data.onParamChange(data.id, paramName, value)
    }
  }

  const params = data?.params || {}
  const currentParams = params

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
    minWidth: '180px'
  }

  const headerStyle = {
    fontSize: '0.65rem',
    color: '#00ff00',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '8px'
  }

  const selectStyle = {
    width: '100%',
    background: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #00ff00',
    padding: '4px',
    fontFamily: 'Silkscreen, monospace',
    fontSize: '0.6rem',
    marginBottom: '8px',
    outline: 'none'
  }

  const controlGroupStyle = {
    marginBottom: '6px'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.55rem',
    color: '#888',
    marginBottom: '2px'
  }

  const sliderStyle = {
    width: '100%',
    height: '4px',
    background: '#1a1a1a',
    border: '1px solid #00ff00',
    outline: 'none'
  }

  return (
    <div style={baseStyle}>
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
      <div style={headerStyle}>Effect</div>

      <select
        value={algorithm}
        onChange={handleAlgorithmChange}
        style={selectStyle}
        className="nodrag"
      >
        {ALGORITHMS.map((algo) => (
          <option key={algo.id} value={algo.id}>
            {algo.label}
          </option>
        ))}
      </select>

      {algorithm === 'threshold' && (
        <div style={controlGroupStyle}>
          <label style={labelStyle}>
            Threshold: {currentParams.threshold || 128}
          </label>
          <input
            type="range"
            className="nodrag"
            min="0"
            max="255"
            value={currentParams.threshold || 128}
            onChange={(e) => handleParamChange('threshold', parseInt(e.target.value))}
            style={sliderStyle}
          />
        </div>
      )}

      {algorithm === 'bloom' && (
        <div style={controlGroupStyle}>
          <label style={labelStyle}>
            Bloom: {(currentParams.bloom || 0).toFixed(2)}
          </label>
          <input
            type="range"
            className="nodrag"
            min="0"
            max="1"
            step="0.01"
            value={currentParams.bloom || 0}
            onChange={(e) => handleParamChange('bloom', parseFloat(e.target.value))}
            style={sliderStyle}
          />
        </div>
      )}

      {algorithm === 'contrast' && (
        <div style={controlGroupStyle}>
          <label style={labelStyle}>
            Amount: {currentParams.amount || 1.0}
          </label>
          <input
            type="range"
            className="nodrag"
            min="0.5"
            max="3"
            step="0.1"
            value={currentParams.amount || 1.0}
            onChange={(e) => handleParamChange('amount', parseFloat(e.target.value))}
            style={sliderStyle}
          />
        </div>
      )}

      {(algorithm === 'bayerOrdered' ||
        algorithm === 'bayerOrdered4x4' ||
        algorithm === 'bayerOrdered16x16' ||
        algorithm === 'randomOrdered') && (
        <div style={controlGroupStyle}>
          <label style={labelStyle}>
            Size: {currentParams.size || 10}
          </label>
          <input
            type="range"
            className="nodrag"
            min="1"
            max="50"
            value={currentParams.size || 10}
            onChange={(e) => handleParamChange('size', parseInt(e.target.value))}
            style={sliderStyle}
          />
        </div>
      )}

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
    </div>
  )
}
