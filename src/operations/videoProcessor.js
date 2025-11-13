// Video processing operations for dithering effects

export class VideoProcessor {
  constructor() {
    this.video = null
    this.canvas = null
    this.ctx = null
    this.frames = []
    this.processedFrames = []
    this.isProcessing = false
  }

  async loadVideo(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        this.video = video
        this.canvas = document.createElement('canvas')
        this.canvas.width = video.videoWidth
        this.canvas.height = video.videoHeight
        this.ctx = this.canvas.getContext('2d')
        URL.revokeObjectURL(url)
        resolve(video)
      })
      
      video.addEventListener('error', (error) => {
        URL.revokeObjectURL(url)
        reject(error)
      })
    })
  }

  extractFrames(frameRate = 30) {
    return new Promise((resolve) => {
      if (!this.video) {
        resolve([])
        return
      }

      const duration = this.video.duration
      const totalFrames = Math.floor(duration * frameRate)
      const frameInterval = duration / totalFrames
      const frames = []

      let currentTime = 0
      let frameCount = 0

      const extractFrame = () => {
        if (currentTime >= duration || frameCount >= totalFrames) {
          this.frames = frames
          resolve(frames)
          return
        }

        this.video.currentTime = currentTime
        this.video.addEventListener('seeked', function onSeeked() {
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
          frames.push({
            data: imageData,
            timestamp: currentTime,
            frameNumber: frameCount
          })
          
          frameCount++
          currentTime += frameInterval
          
          this.video.removeEventListener('seeked', onSeeked)
          setTimeout(extractFrame, 10)
        }.bind(this))

        this.video.addEventListener('seeked', function onSeeked() {
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height)
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
          frames.push({
            data: imageData,
            timestamp: currentTime,
            frameNumber: frameCount
          })
          
          frameCount++
          currentTime += frameInterval
          
          this.video.removeEventListener('seeked', onSeeked)
          setTimeout(extractFrame, 10)
        }.bind(this))
      }

      extractFrame()
    })
  }

  async processFrames(ditheringAlgorithm, options = {}) {
    this.isProcessing = true
    this.processedFrames = []

    // Import glitch effects dynamically
    const { dataMosh, pixelSort, chromaticAberration, digitalCorruption } = await import('./algorithms.jsx')

    for (let i = 0; i < this.frames.length; i++) {
      const frame = this.frames[i]
      
      // Apply time-based effects for animation
      const animatedOptions = {
        ...options,
        time: frame.timestamp,
        frameNumber: i,
        totalFrames: this.frames.length
      }

      // Apply glitch effects based on selection
      if (options.glitchEnabled && options.selectedGlitchEffect) {
        switch (options.selectedGlitchEffect) {
          case 'dataMosh':
            frame.data = dataMosh(frame.data, { 
              intensity: options.glitchIntensity, 
              time: frame.timestamp 
            })
            break
          case 'pixelSort':
            frame.data = pixelSort(frame.data, { 
              threshold: 128, 
              direction: 'horizontal',
              time: frame.timestamp 
            })
            break
          case 'chromaticAberration':
            frame.data = chromaticAberration(frame.data, { 
              intensity: options.glitchIntensity * 10, 
              time: frame.timestamp 
            })
            break
          case 'digitalCorruption':
            frame.data = digitalCorruption(frame.data, { 
              intensity: options.glitchIntensity, 
              time: frame.timestamp 
            })
            break
          default:
            this.applyGlitchEffect(frame.data, animatedOptions)
        }
      }

      // Apply dithering
      const processedFrame = await this.applyDithering(frame.data, ditheringAlgorithm, animatedOptions)
      
      this.processedFrames.push({
        ...processedFrame,
        timestamp: frame.timestamp,
        frameNumber: i
      })

      // Allow UI to remain responsive
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1))
      }
    }

    this.isProcessing = false
    return this.processedFrames
  }

  applyGlitchEffect(imageData, options) {
    const { glitchIntensity = 0.1 } = options
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height

    // Random glitch blocks
    if (Math.random() < glitchIntensity) {
      const glitchHeight = Math.floor(Math.random() * 20) + 5
      const glitchY = Math.floor(Math.random() * height)
      const glitchShift = Math.floor(Math.random() * 20) - 10

      for (let y = glitchY; y < Math.min(glitchY + glitchHeight, height); y++) {
        for (let x = 0; x < width; x++) {
          const sourceX = Math.max(0, Math.min(width - 1, x + glitchShift))
          const targetIdx = (y * width + x) * 4
          const sourceIdx = (y * width + sourceX) * 4

          // Shift color channels
          data[targetIdx] = data[sourceIdx] // Red
          data[targetIdx + 1] = data[sourceIdx + 1] // Green  
          data[targetIdx + 2] = data[sourceIdx + 2] // Blue
        }
      }
    }

    // RGB channel shift
    if (Math.random() < glitchIntensity * 0.5) {
      const channelShift = Math.floor(Math.random() * 10)
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.01) {
          data[i] = data[Math.min(i + channelShift * 4, data.length - 4)]     // Red shift
          data[i + 2] = data[Math.max(i - channelShift * 4, 0)] // Blue shift
        }
      }
    }

    // Noise injection
    if (Math.random() < glitchIntensity * 0.8) {
      for (let i = 0; i < data.length; i += 4) {
        if (Math.random() < 0.001) {
          const noise = Math.random() * 255
          data[i] = noise     // Red
          data[i + 1] = noise // Green
          data[i + 2] = noise // Blue
        }
      }
    }
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

    return ditheredData
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
      // Try to use gif.js if available
      const GIF = await import('gif.js')
      
      return new Promise((resolve, reject) => {
        const gif = new GIF.default({
          workers: 2,
          quality: quality,
          width: this.canvas.width,
          height: this.canvas.height,
          workerScript: '/gif.worker.js'
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
          // Create a temporary canvas for each frame
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = frame.data.width
          tempCanvas.height = frame.data.height
          const tempCtx = tempCanvas.getContext('2d')
          tempCtx.putImageData(frame.data, 0, 0)

          // Add frame with delay based on frame rate
          const delay = 1000 / frameRate
          gif.addFrame(tempCanvas, { delay })
        })

        gif.render()
      })
    } catch {
      // Fallback: create a simple animated GIF using canvas-to-blob approach
      console.warn('gif.js not available, using fallback export method')
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
    // For now, we'll export as WebM since browser-based MP4 encoding is limited
    // The user can convert WebM to MP4 using external tools if needed
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

  cleanup() {
    this.video = null
    this.canvas = null
    this.ctx = null
    this.frames = []
    this.processedFrames = []
    this.isProcessing = false
  }
}