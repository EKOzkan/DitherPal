import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'

class BackgroundRemovalProcessor {
  constructor() {
    this.selfieSegmentation = null
    this.modelLoaded = false
    this.maskCache = new Map()
    this.currentMask = null
  }

  async initialize() {
    if (this.modelLoaded) return

    this.selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      }
    })

    this.selfieSegmentation.setOptions({
      modelSelection: 1, // Use model 1 for better accuracy
      selfieMode: false
    })

    return new Promise((resolve, reject) => {
      this.selfieSegmentation.onResults((results) => {
        this.modelLoaded = true
        resolve(results)
      })

      // Initialize with a dummy frame to load the model
      const dummyCanvas = document.createElement('canvas')
      dummyCanvas.width = 1
      dummyCanvas.height = 1
      const dummyCtx = dummyCanvas.getContext('2d')
      dummyCtx.fillStyle = '#000000'
      dummyCtx.fillRect(0, 0, 1, 1)
      
      this.selfieSegmentation.send({ image: dummyCanvas })
        .catch(reject)
    })
  }

  async generateMask(imageData) {
    // Create a cache key based on image dimensions
    const cacheKey = `${imageData.width}x${imageData.height}`
    
    // Check if we have a cached mask for this image size
    if (this.maskCache.has(cacheKey)) {
      return this.maskCache.get(cacheKey)
    }

    if (!this.modelLoaded) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      const ctx = canvas.getContext('2d')
      
      // Convert ImageData to canvas
      ctx.putImageData(imageData, 0, 0)

      this.selfieSegmentation.onResults((results) => {
        if (results && results.segmentationMask) {
          const maskCanvas = document.createElement('canvas')
          maskCanvas.width = results.segmentationMask.width
          maskCanvas.height = results.segmentationMask.height
          const maskCtx = maskCanvas.getContext('2d')
          maskCtx.drawImage(results.segmentationMask, 0, 0)
          
          const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
          
          // Cache the mask
          this.maskCache.set(cacheKey, maskData)
          this.currentMask = maskData
          
          resolve(maskData)
        } else {
          reject(new Error('Failed to generate segmentation mask'))
        }
      })

      this.selfieSegmentation.send({ image: canvas })
        .catch(reject)
    })
  }

  clearMaskCache() {
    this.maskCache.clear()
    this.currentMask = null
  }
}

// Global instance for caching
let globalProcessor = null

function getProcessor() {
  if (!globalProcessor) {
    globalProcessor = new BackgroundRemovalProcessor()
  }
  return globalProcessor
}

/**
 * Removes background from an image using MediaPipe segmentation mask
 * @param {ImageData} imageData - The original image data
 * @param {ImageData} mask - The segmentation mask from MediaPipe (0-255 values)
 * @param {number} threshold - Sensitivity threshold (0-255, default 128)
 * @param {boolean} featherEdges - Whether to apply edge feathering
 * @param {number} featherAmount - Feather amount in pixels (1-20)
 * @returns {ImageData} - Image with background removed (black background)
 */
function removeBackground(imageData, mask, threshold = 128, featherEdges = false, featherAmount = 5) {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  )

  // Apply binary thresholding based on mask sensitivity
  for (let i = 0; i < result.data.length; i += 4) {
    const maskIndex = Math.floor(i / 4)
    const maskValue = mask.data[maskIndex * 4] // Mask is grayscale, so use red channel
    
    // If mask value is below threshold, set pixel to black (background)
    if (maskValue < threshold) {
      result.data[i] = 0     // R
      result.data[i + 1] = 0 // G
      result.data[i + 2] = 0 // B
      // Alpha remains unchanged to preserve transparency
    }
  }

  // Apply feathering if enabled
  if (featherEdges && featherAmount > 0) {
    applyFeathering(result, mask, threshold, featherAmount)
  }

  return result
}

/**
 * Applies feathering/smoothing to the edges of the segmented object
 * @param {ImageData} imageData - The image data to modify
 * @param {ImageData} mask - The segmentation mask
 * @param {number} threshold - The threshold value
 * @param {number} featherAmount - Feather radius in pixels
 */
function applyFeathering(imageData, mask, threshold, featherAmount) {
  const { width, height } = imageData
  const result = new Uint8ClampedArray(imageData.data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const maskValue = mask.data[(y * width + x) * 4]

      // Only process pixels near the edge (within feather range of threshold)
      if (Math.abs(maskValue - threshold) < featherAmount * 20) {
        // Calculate average of neighboring mask values
        let totalWeight = 0
        let weightedMaskSum = 0

        for (let dy = -featherAmount; dy <= featherAmount; dy++) {
          for (let dx = -featherAmount; dx <= featherAmount; dx++) {
            const ny = y + dy
            const nx = x + dx
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              const weight = Math.max(0, 1 - distance / featherAmount)
              
              const neighborIdx = (ny * width + nx) * 4
              const neighborMaskValue = mask.data[neighborIdx]
              
              weightedMaskSum += neighborMaskValue * weight
              totalWeight += weight
            }
          }
        }

        const smoothedMaskValue = weightedMaskSum / totalWeight
        
        // Blend between original pixel and black based on smoothed mask
        if (smoothedMaskValue < threshold) {
          const blendFactor = Math.max(0, Math.min(1, smoothedMaskValue / threshold))
          
          result[idx] = imageData.data[idx] * blendFactor
          result[idx + 1] = imageData.data[idx + 1] * blendFactor
          result[idx + 2] = imageData.data[idx + 2] * blendFactor
        }
      }
    }
  }

  imageData.data.set(result)
}

/**
 * Checks if background removal is available (model loaded)
 * @returns {boolean} - True if MediaPipe model is loaded
 */
function isBackgroundRemovalAvailable() {
  const processor = getProcessor()
  return processor.modelLoaded
}

/**
 * Gets a cached mask if available
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {ImageData|null} - Cached mask or null
 */
function getCachedMask(width, height) {
  const processor = getProcessor()
  const cacheKey = `${width}x${height}`
  return processor.maskCache.get(cacheKey) || null
}

/**
 * Clears the mask cache
 */
function clearMaskCache() {
  const processor = getProcessor()
  processor.clearMaskCache()
}

/**
 * Generates a segmentation mask for the given image data
 * @param {ImageData} imageData - The image data to process
 * @returns {Promise<ImageData>} - Promise that resolves with the segmentation mask
 */
function generateMask(imageData) {
  return getProcessor().generateMask(imageData)
}

export {
  getProcessor,
  removeBackground,
  isBackgroundRemovalAvailable,
  getCachedMask,
  clearMaskCache,
  generateMask
}