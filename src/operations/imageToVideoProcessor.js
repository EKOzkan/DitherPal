// Image to video processor with animated dithering effects

export class ImageToVideoProcessor {
  constructor() {
    this.processedFrames = []
    this.sourceImage = null
    this.canvas = null
    this.ctx = null
    this.textOverlay = null
  }

  async loadImage(imageDataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.sourceImage = img
        this.canvas = document.createElement('canvas')
        this.canvas.width = img.width
        this.canvas.height = img.height
        this.ctx = this.canvas.getContext('2d')
        resolve(img)
      }
      img.onerror = reject
      img.src = imageDataUrl
    })
  }

  async generateAnimatedFrames(ditheringAlgorithm, baseOptions, animationSettings) {
    if (!this.sourceImage) {
      throw new Error('No source image loaded')
    }

    this.processedFrames = []
    const { duration, frameRate, animationType, animationParams } = animationSettings
    const totalFrames = Math.max(1, Math.floor(duration * frameRate))

    for (let i = 0; i < totalFrames; i++) {
      const progress = i / (totalFrames - 1 || 1) // 0 to 1
      
      // Draw source image to canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.ctx.drawImage(this.sourceImage, 0, 0)
      
      // Get image data
      const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
      
      // Calculate animated parameters based on animation type
      const animatedOptions = this.calculateAnimatedParams(
        baseOptions, 
        progress, 
        animationType, 
        animationParams
      )
      
      // Apply dithering with animated parameters
      let processedFrame = await this.applyDithering(
        imageData, 
        ditheringAlgorithm, 
        animatedOptions
      )
      
      // Apply text overlay if configured
      if (this.textOverlay && this.textOverlay.textLayers.length > 0) {
        processedFrame = this.textOverlay.applyTextOverlay(
          processedFrame,
          i / frameRate,
          i,
          totalFrames
        )
      }
      
      this.processedFrames.push({
        data: processedFrame,
        timestamp: i / frameRate,
        frameNumber: i
      })

      // Allow UI to remain responsive
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    return this.processedFrames
  }

  calculateAnimatedParams(baseOptions, progress, animationType, animationParams) {
    const options = { ...baseOptions }
    const cycles = Math.max(1, animationParams?.cycles ?? 1)
    const intensity = Math.max(0, Math.min(1, animationParams?.intensity ?? 1))
    const clamp = (value, min = 0, max = 255) => Math.max(min, Math.min(max, value))

    const baseThreshold = options.threshold ?? 128
    const baseContrast = options.contrast ?? 128
    const baseBloom = options.bloom ?? 0
    const baseRed = options.redValue ?? 255
    const baseGreen = options.greenValue ?? 255
    const baseBlue = options.blueValue ?? 255
    const baseMidtones = options.midtones ?? 128
    const baseHighlights = options.highlights ?? 128
    const baseGlitch = options.glitchIntensity ?? 0.1
    const sine = Math.sin(progress * Math.PI * 2 * cycles)

    switch (animationType) {
      case 'threshold-wave': {
        const amplitude = 128 * intensity
        options.threshold = clamp(baseThreshold + sine * amplitude)
        options.luminanceThresholdEnabled = true
        break
      }

      case 'contrast-pulse': {
        const amplitude = 128 * intensity
        options.contrast = clamp(baseContrast + sine * amplitude)
        break
      }

      case 'color-cycle': {
        const hue = (progress * 360 * cycles) % 360
        const rgb = this.hslToRgb(hue / 360, 1, 0.5)
        options.colorMode = 'rgb'
        options.redValue = clamp(Math.round(baseRed * (1 - intensity) + rgb[0] * intensity))
        options.greenValue = clamp(Math.round(baseGreen * (1 - intensity) + rgb[1] * intensity))
        options.blueValue = clamp(Math.round(baseBlue * (1 - intensity) + rgb[2] * intensity))
        break
      }

      case 'bloom-pulse': {
        const maxBloom = animationParams?.maxBloom ?? 120
        const bloomValue = Math.abs(sine) * maxBloom * intensity
        options.bloom = clamp(baseBloom + bloomValue)
        break
      }

      case 'glitch-wave': {
        const normalized = 0.5 + (sine * 0.5)
        options.glitchEnabled = true
        const targetGlitch = Math.max(0, Math.min(1, normalized))
        options.glitchIntensity = Math.max(0, Math.min(1, baseGlitch + (targetGlitch - baseGlitch) * intensity))
        options.time = progress
        break
      }

      case 'threshold-sweep': {
        const sweepValue = progress * 255
        options.threshold = clamp(baseThreshold * (1 - intensity) + sweepValue * intensity)
        options.luminanceThresholdEnabled = true
        break
      }

      case 'rgb-split': {
        const amplitude = 127 * intensity
        options.colorMode = 'rgb'
        options.redValue = clamp(baseRed + amplitude * Math.sin(progress * Math.PI * 2 * cycles))
        options.greenValue = clamp(baseGreen + amplitude * Math.sin(progress * Math.PI * 2 * cycles + (Math.PI * 2) / 3))
        options.blueValue = clamp(baseBlue + amplitude * Math.sin(progress * Math.PI * 2 * cycles + (Math.PI * 4) / 3))
        break
      }

      case 'all-params': {
        const thresholdAmplitude = 120 * intensity
        const contrastAmplitude = 100 * intensity
        const bloomAmplitude = 150 * intensity
        const midtoneAmplitude = 60 * intensity
        const highlightAmplitude = 60 * intensity

        options.threshold = clamp(baseThreshold + Math.sin(progress * Math.PI * 2) * thresholdAmplitude)
        options.contrast = clamp(baseContrast + Math.sin(progress * Math.PI * 3) * contrastAmplitude)
        options.bloom = clamp(baseBloom + Math.abs(Math.sin(progress * Math.PI * 4)) * bloomAmplitude)
        options.midtones = clamp(baseMidtones + Math.sin(progress * Math.PI * 2) * midtoneAmplitude)
        options.highlights = clamp(baseHighlights + Math.sin(progress * Math.PI * 2 + Math.PI / 2) * highlightAmplitude)
        options.luminanceThresholdEnabled = true
        options.glitchEnabled = baseOptions.glitchEnabled || intensity > 0
        const normalized = 0.5 + (sine * 0.5)
        options.glitchIntensity = Math.max(0, Math.min(1, baseGlitch + (normalized - baseGlitch) * intensity))
        options.time = progress
        break
      }

      default:
        break
    }

    return options
  }

  hslToRgb(h, s, l) {
    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  }

  async applyDithering(imageData, algorithm, options) {
    // Apply adjustments first
    let processedData = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    // Apply adjustments
    this.applyContrast(processedData, options.contrast || 128)
    this.applyMidtones(processedData, options.midtones || 128)
    this.applyHighlights(processedData, options.highlights || 128)
    
    // Apply threshold before dithering if enabled
    if (options.luminanceThresholdEnabled) {
      this.applyLuminanceThreshold(processedData, options.threshold || 128)
    }

    // Apply dithering algorithm
    let ditheredData
    if (typeof algorithm === 'function') {
      ditheredData = algorithm(processedData)
    } else {
      ditheredData = processedData
    }

    // Apply color mode
    const coloredData = new ImageData(
      new Uint8ClampedArray(ditheredData.data),
      ditheredData.width,
      ditheredData.height
    )

    // Apply color tinting based on selected mode
    for (let i = 0; i < coloredData.data.length; i += 4) {
      const brightness = (ditheredData.data[i] + ditheredData.data[i + 1] + ditheredData.data[i + 2]) / 3

      if (options.colorMode === "rgb") {
        coloredData.data[i] = (brightness / 255) * (options.redValue || 255)
        coloredData.data[i + 1] = (brightness / 255) * (options.greenValue || 255)
        coloredData.data[i + 2] = (brightness / 255) * (options.blueValue || 255)
      } else {
        // Parse the hex color into RGB components
        const singleColor = options.singleColor || "#ffffff"
        const r = parseInt(singleColor.slice(1, 3), 16)
        const g = parseInt(singleColor.slice(3, 5), 16)
        const b = parseInt(singleColor.slice(5, 7), 16)
        
        // Use threshold to create true black or selected color
        if (brightness < 128) {
          coloredData.data[i] = 0     // Black
          coloredData.data[i + 1] = 0
          coloredData.data[i + 2] = 0
        } else {
          coloredData.data[i] = r     // Selected color
          coloredData.data[i + 1] = g
          coloredData.data[i + 2] = b
        }
      }
      coloredData.data[i + 3] = 255 // Alpha channel
    }

    ditheredData = coloredData

    // Apply bloom as post-processing if enabled
    if (options.bloom > 0) {
      ditheredData = this.applyBloom(ditheredData, options.bloom)
    }

    // Apply glitch effects if enabled
    if (options.glitchEnabled) {
      ditheredData = await this.applyGlitchEffect(ditheredData, options)
    }

    return ditheredData
  }

  async applyGlitchEffect(imageData, options) {
    const { dataMosh, pixelSort, chromaticAberration, digitalCorruption } = await import('./algorithms.jsx')
    
    const glitchFunctions = {
      dataMosh,
      pixelSort,
      chromaticAberration,
      digitalCorruption
    }
    
    const glitchFn = glitchFunctions[options.selectedGlitchEffect]
    if (glitchFn) {
      return glitchFn(imageData, {
        intensity: options.glitchIntensity,
        time: options.time
      })
    }
    
    return imageData
  }

  applyContrast(imageData, contrastValue) {
    const data = imageData.data
    const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue))
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = this.clamp(factor * (data[i]   - 128) + 128)
      data[i+1] = this.clamp(factor * (data[i+1] - 128) + 128)
      data[i+2] = this.clamp(factor * (data[i+2] - 128) + 128)
    }
  }

  applyMidtones(imageData, midtoneValue) {
    const data = imageData.data
    const gamma = midtoneValue / 128
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = this.clamp(255 * Math.pow(data[i]   / 255, 1 / gamma))
      data[i+1] = this.clamp(255 * Math.pow(data[i+1] / 255, 1 / gamma))
      data[i+2] = this.clamp(255 * Math.pow(data[i+2] / 255, 1 / gamma))
    }
  }

  applyHighlights(imageData, highlightValue) {
    const data = imageData.data
    const factor = highlightValue / 128
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]   > 128) data[i]   = this.clamp(data[i]   * factor)
      if (data[i+1] > 128) data[i+1] = this.clamp(data[i+1] * factor)
      if (data[i+2] > 128) data[i+2] = this.clamp(data[i+2] * factor)
    }
  }

  applyLuminanceThreshold(imageData, thresholdValue) {
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      // Using BT.601 standard for luminance calculation
      const luminance = Math.round(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2])
      // Create a sharp black/white boundary
      const value = luminance >= thresholdValue ? 255 : 0
      data[i] = value     // R
      data[i+1] = value   // G
      data[i+2] = value   // B
    }
  }

  applyBloom(imageData, intensity) {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const result = new ImageData(new Uint8ClampedArray(data), width, height)
    const resultData = result.data

    // Create a working copy
    const workingData = new Uint8ClampedArray(data)

    // Simple 3x3 blur kernel
    const blurKernel = [
      [1/16, 2/16, 1/16],
      [2/16, 4/16, 2/16],
      [1/16, 2/16, 1/16]
    ]

    // Function to apply single blur pass
    function blurPass(input, output) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let r = 0, g = 0, b = 0

          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const px = Math.min(Math.max(x + kx, 0), width - 1)
              const py = Math.min(Math.max(y + ky, 0), height - 1)
              const idx = (py * width + px) * 4
              const weight = blurKernel[ky + 1][kx + 1]

              r += input[idx] * weight
              g += input[idx + 1] * weight
              b += input[idx + 2] * weight
            }
          }

          const idx = (y * width + x) * 4
          output[idx] = r
          output[idx + 1] = g
          output[idx + 2] = b
          output[idx + 3] = 255
        }
      }
    }

    // Apply multiple blur passes
    const numPasses = 3
    const tempData = new Uint8ClampedArray(data)
    
    for (let pass = 0; pass < numPasses; pass++) {
      if (pass % 2 === 0) {
        blurPass(workingData, tempData)
      } else {
        blurPass(tempData, workingData)
      }
    }

    // Enhance bright areas
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (workingData[i] + workingData[i + 1] + workingData[i + 2]) / 3
      if (brightness > 128) {
        workingData[i] = this.clamp(workingData[i] * 1.2)
        workingData[i + 1] = this.clamp(workingData[i + 1] * 1.2)
        workingData[i + 2] = this.clamp(workingData[i + 2] * 1.2)
      }
    }

    // Blend with original using screen blend mode for better glow
    const bloomStrength = intensity / 100
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const a = data[i + j] / 255
        const b = (workingData[i + j] * bloomStrength) / 255
        resultData[i + j] = this.clamp((1 - (1 - a) * (1 - b)) * 255)
      }
      resultData[i + 3] = 255
    }

    return result
  }

  clamp(value) {
    return Math.max(0, Math.min(255, value))
  }

  async exportAsGIF(frameRate = 30, quality = 10) {
    if (this.processedFrames.length === 0) {
      throw new Error('No processed frames to export')
    }

    try {
      const GIF = await import('gif.js')
      
      return new Promise((resolve, reject) => {
        const gif = new GIF.default({
          workers: 2,
          quality: quality,
          width: this.canvas.width,
          height: this.canvas.height,
          workerScript: '/gif.worker.js',
          repeat: 0 // Loop forever
        })

        gif.on('finished', (blob) => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        })

        gif.on('error', (error) => {
          reject(error)
        })

        // Add each frame to the GIF
        this.processedFrames.forEach((frame) => {
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = frame.data.width
          tempCanvas.height = frame.data.height
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.putImageData(frame.data, 0, 0)

          const delay = 1000 / frameRate
          gif.addFrame(tempCanvas, { delay })
        })

        gif.render()
      })
    } catch (error) {
      console.error('gif.js error:', error)
      return this.exportAsWebM(frameRate)
    }
  }

  async exportAsWebM(frameRate = 30) {
    if (this.processedFrames.length === 0) {
      throw new Error('No processed frames to export')
    }

    const canvas = document.createElement('canvas')
    canvas.width = this.processedFrames[0].data.width
    canvas.height = this.processedFrames[0].data.height
    const ctx = canvas.getContext('2d')

    const stream = canvas.captureStream(frameRate)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000
    })

    const chunks = []

    return new Promise((resolve) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        resolve(url)
      }

      mediaRecorder.start()

      // Play frames through the canvas
      let frameIndex = 0
      const playNextFrame = () => {
        if (frameIndex >= this.processedFrames.length) {
          mediaRecorder.stop()
          return
        }

        ctx.putImageData(this.processedFrames[frameIndex].data, 0, 0)
        frameIndex++

        setTimeout(playNextFrame, 1000 / frameRate)
      }

      playNextFrame()
    })
  }

  async exportAsMP4(frameRate = 30) {
    console.log('Exporting as WebM format (MP4 conversion requires external tools)')
    return this.exportAsWebM(frameRate)
  }

  getFramePreview(frameNumber) {
    if (this.processedFrames[frameNumber]) {
      const canvas = document.createElement('canvas')
      canvas.width = this.processedFrames[frameNumber].data.width
      canvas.height = this.processedFrames[frameNumber].data.height
      const ctx = canvas.getContext('2d')
      ctx.putImageData(this.processedFrames[frameNumber].data, 0, 0)
      return canvas.toDataURL()
    }
    return null
  }

  setTextOverlay(textOverlay) {
    this.textOverlay = textOverlay
  }

  cleanup() {
    this.sourceImage = null
    this.canvas = null
    this.ctx = null
    this.processedFrames = []
    this.textOverlay = null
  }
}
