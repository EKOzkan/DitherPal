export class TextOverlay {
  constructor() {
    this.textLayers = []
  }

  addTextLayer(config) {
    const defaultConfig = {
      text: 'YOUR TEXT HERE',
      fontFamily: 'Impact',
      fontSize: 72,
      color: '#ffffff',
      strokeColor: '#000000',
      strokeWidth: 4,
      position: { x: 50, y: 50 },
      positionType: 'percent',
      alignment: 'center',
      animationType: 'none',
      animationDuration: 1,
      startTime: 0,
      endTime: Infinity,
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.8)',
      shadowBlur: 8,
      shadowOffsetX: 4,
      shadowOffsetY: 4,
    }
    
    this.textLayers.push({ ...defaultConfig, ...config })
    return this.textLayers.length - 1
  }

  updateTextLayer(index, config) {
    if (index >= 0 && index < this.textLayers.length) {
      this.textLayers[index] = { ...this.textLayers[index], ...config }
    }
  }

  removeTextLayer(index) {
    if (index >= 0 && index < this.textLayers.length) {
      this.textLayers.splice(index, 1)
    }
  }

  clearTextLayers() {
    this.textLayers = []
  }

  applyTextOverlay(imageData, currentTime = 0, frameNumber = 0, totalFrames = 1) {
    const canvas = document.createElement('canvas')
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext('2d')
    
    ctx.putImageData(imageData, 0, 0)
    
    this.textLayers.forEach((layer) => {
      if (currentTime >= layer.startTime && currentTime <= layer.endTime) {
        this.drawTextLayer(ctx, layer, currentTime, frameNumber, totalFrames, canvas.width, canvas.height)
      }
    })
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
  }

  drawTextLayer(ctx, layer, currentTime, frameNumber, totalFrames, canvasWidth, canvasHeight) {
    const animationProgress = this.calculateAnimationProgress(
      layer, 
      currentTime
    )
    
    ctx.save()
    
    const position = this.calculatePosition(layer, canvasWidth, canvasHeight)
    const animationTransform = this.getAnimationTransform(
      layer, 
      animationProgress
    )
    
    ctx.globalAlpha = animationTransform.opacity
    ctx.translate(position.x, position.y)
    
    if (animationTransform.rotation !== 0) {
      ctx.rotate(animationTransform.rotation)
    }
    
    if (animationTransform.scale !== 1) {
      ctx.scale(animationTransform.scale, animationTransform.scale)
    }
    
    ctx.translate(animationTransform.offsetX, animationTransform.offsetY)
    
    if (layer.shadow) {
      ctx.shadowColor = layer.shadowColor
      ctx.shadowBlur = layer.shadowBlur
      ctx.shadowOffsetX = layer.shadowOffsetX
      ctx.shadowOffsetY = layer.shadowOffsetY
    }
    
    ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
    ctx.textAlign = layer.alignment
    ctx.textBaseline = 'middle'
    
    const text = this.getVisibleText(layer, animationProgress)
    
    // Don't draw if text is empty
    if (!text) {
      ctx.restore()
      return
    }
    
    // For wave animation, use special drawing
    if (layer.animationType === 'wave') {
      this.drawWaveText(ctx, layer, text, animationProgress)
    } else {
      // Regular text drawing
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth
        ctx.lineJoin = 'round'
        ctx.strokeText(text, 0, 0)
      }
      
      ctx.fillStyle = layer.color
      ctx.fillText(text, 0, 0)
    }
    
    ctx.restore()
  }

  calculatePosition(layer, canvasWidth, canvasHeight) {
    if (layer.positionType === 'percent') {
      return {
        x: (layer.position.x / 100) * canvasWidth,
        y: (layer.position.y / 100) * canvasHeight
      }
    }
    return { x: layer.position.x, y: layer.position.y }
  }

  measureText(ctx, layer) {
    ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
    const metrics = ctx.measureText(layer.text)
    return {
      width: metrics.width,
      height: layer.fontSize
    }
  }

  calculateAnimationProgress(layer, currentTime) {
    if (layer.animationType === 'none') {
      return 1
    }
    
    const animationElapsed = currentTime - layer.startTime
    const progress = Math.min(1, Math.max(0, animationElapsed / layer.animationDuration))
    
    return this.easeInOutQuad(progress)
  }

  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  easeOutBounce(t) {
    const n1 = 7.5625
    const d1 = 2.75
    
    if (t < 1 / d1) {
      return n1 * t * t
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
  }

  getVisibleText(layer, progress) {
    if (layer.animationType === 'typewriter') {
      const visibleLength = Math.floor(layer.text.length * progress)
      return layer.text.substring(0, visibleLength)
    }
    return layer.text
  }

  getAnimationTransform(layer, progress) {
    const transform = {
      opacity: 1,
      scale: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0
    }
    
    switch (layer.animationType) {
      case 'none':
        break
        
      case 'typewriter':
        break
        
      case 'fade-in':
        transform.opacity = progress
        break
        
      case 'slide-left':
        transform.offsetX = (1 - progress) * 300
        break
        
      case 'slide-right':
        transform.offsetX = -(1 - progress) * 300
        break
        
      case 'slide-up':
        transform.offsetY = (1 - progress) * 200
        break
        
      case 'slide-down':
        transform.offsetY = -(1 - progress) * 200
        break
        
      case 'zoom':
        transform.scale = 0.3 + progress * 0.7
        transform.opacity = progress
        break
        
      case 'bounce': {
        const bounceProgress = this.easeOutBounce(progress)
        transform.offsetY = -(1 - bounceProgress) * 100
        break
      }
        
      case 'rotate':
        transform.rotation = (1 - progress) * Math.PI * 2
        transform.opacity = progress
        break
        
      case 'glow': {
        const glowIntensity = Math.sin(progress * Math.PI * 4)
        transform.opacity = 0.7 + glowIntensity * 0.3
        break
      }
        
      case 'wave':
        break
        
      default:
        break
    }
    
    return transform
  }

  drawWaveText(ctx, layer, text, progress) {
    ctx.font = `${layer.fontSize}px ${layer.fontFamily}`
    const charSpacing = ctx.measureText('M').width * 0.8
    let currentX = 0
    
    switch (layer.alignment) {
      case 'center':
        currentX = -(text.length * charSpacing) / 2
        break
      case 'right':
        currentX = -(text.length * charSpacing)
        break
      default:
        currentX = 0
    }
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const waveOffset = Math.sin((progress * Math.PI * 2) + (i * 0.5)) * 10
      
      ctx.save()
      ctx.translate(currentX, waveOffset)
      
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = layer.strokeWidth
        ctx.lineJoin = 'round'
        ctx.strokeText(char, 0, 0)
      }
      
      ctx.fillStyle = layer.color
      ctx.fillText(char, 0, 0)
      ctx.restore()
      
      currentX += ctx.measureText(char).width
    }
  }
}

export const TEXT_ANIMATION_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-left', label: 'Slide from Left' },
  { value: 'slide-right', label: 'Slide from Right' },
  { value: 'slide-up', label: 'Slide from Top' },
  { value: 'slide-down', label: 'Slide from Bottom' },
  { value: 'zoom', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'rotate', label: 'Rotate' },
  { value: 'wave', label: 'Wave' },
  { value: 'glow', label: 'Glow Pulse' }
]

export const FONT_FAMILIES = [
  'Arial',
  'Arial Black',
  'Courier New',
  'Comic Sans MS',
  'Georgia',
  'Impact',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Helvetica',
  'monospace',
  'cursive',
  'fantasy'
]
