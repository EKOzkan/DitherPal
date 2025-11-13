import React, { useState, useRef, useEffect } from 'react';

const TextOverlayPreview = ({ 
  textOverlay, 
  onTextOverlayChange, 
  videoMode, 
  imageToVideoMode,
  processedCanvas 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [textPosition, setTextPosition] = useState({ 
    x: textOverlay.x || 50, 
    y: textOverlay.y || 50 
  });
  const previewRef = useRef(null);
  const containerRef = useRef(null);

  // Update position when textOverlay changes
  useEffect(() => {
    setTextPosition({ 
      x: textOverlay.x || 50, 
      y: textOverlay.y || 50 
    });
  }, [textOverlay.x, textOverlay.y]);

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    if (!textOverlay.enabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ 
      x: startX - (textPosition.x * rect.width / 100), 
      y: startY - (textPosition.y * rect.height / 100) 
    });
    
    e.preventDefault();
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging || !textOverlay.enabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100;
    
    // Clamp values to 0-100%
    const clampedX = Math.max(5, Math.min(95, newX));
    const clampedY = Math.max(5, Math.min(95, newY));
    
    setTextPosition({ x: clampedX, y: clampedY });
    
    // Update text overlay
    onTextOverlayChange({
      ...textOverlay,
      x: clampedX,
      y: clampedY
    });
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart]);

  // Render text preview
  const renderTextPreview = () => {
    if (!textOverlay.enabled || !textOverlay.text) return null;

    const style = {
      position: 'absolute',
      left: `${textPosition.x}%`,
      top: `${textPosition.y}%`,
      fontFamily: textOverlay.fontFamily || 'Arial',
      fontSize: `${textOverlay.fontSize || 24}px`,
      color: textOverlay.color || '#ffffff',
      textAlign: textOverlay.align || 'center',
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      transform: 'translate(-50%, -50%)',
      textShadow: textOverlay.strokeWidth > 0 
        ? `-${textOverlay.strokeWidth}px -${textOverlay.strokeWidth}px 0 ${textOverlay.strokeColor}, 
           ${textOverlay.strokeWidth}px -${textOverlay.strokeWidth}px 0 ${textOverlay.strokeColor}, 
           -${textOverlay.strokeWidth}px ${textOverlay.strokeWidth}px 0 ${textOverlay.strokeColor}, 
           ${textOverlay.strokeWidth}px ${textOverlay.strokeWidth}px 0 ${textOverlay.strokeColor}`
        : 'none',
      whiteSpace: 'pre-wrap',
      maxWidth: '90%',
      pointerEvents: textOverlay.enabled ? 'auto' : 'none',
      zIndex: 1000,
      padding: '4px',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '4px',
      border: isDragging ? '2px dashed #ff6b6b' : 'none'
    };

    return (
      <div
        style={style}
        onMouseDown={handleMouseDown}
      >
        {textOverlay.text}
      </div>
    );
  };

  if (!textOverlay.enabled) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto'
      }}
    >
      {renderTextPreview()}
      {textOverlay.enabled && (
        <div
          style={{
            position: 'absolute',
            left: `${textPosition.x}%`,
            top: `${textPosition.y}%`,
            width: '12px',
            height: '12px',
            backgroundColor: '#ff6b6b',
            border: '2px solid #ffffff',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            cursor: 'grab',
            zIndex: 1001,
            pointerEvents: 'auto',
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}
          onMouseDown={handleMouseDown}
          title="Drag to position text"
        />
      )}
    </div>
  );
};

export default TextOverlayPreview;