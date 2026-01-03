import React from 'react'

export const CollapsibleSection = ({ title, isExpanded, onToggle, children }) => {
  return (
    <div>
      <div className="section-header" onClick={onToggle}>
        <span className="section-title">{title}</span>
        <span className="section-toggle">{isExpanded ? '▼' : '►'}</span>
      </div>
      <div className={`section-content ${isExpanded ? '' : 'collapsed'}`}>
        {children}
      </div>
    </div>
  )
}
