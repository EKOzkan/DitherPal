import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'

class BackgroundRemovalProcessor {
  constructor() {
    this.selfieSegmentation = null
    this.modelLoaded = false
    this.maskCache = new Map()           // Raw masks: key = `${width}x${height}_s${sensitivity}`
    this.featheredMaskCache = new Map()  // Feathered masks: key = `${rawMaskKey}_f${featherAmount}_e${featherEnabled}`
    this.currentMask = null
    this.isComputingMask = false
    this.isApplyingFeather = false
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

  async generateMask(imageData, sensitivity = 128) {
    // Create a cache key based on image dimensions and sensitivity ONLY
    // Feather parameters are handled separately in applyFeatheringToMask
    const cacheKey = `${imageData.width}x${imageData.height}_s${sensitivity}`

    // Check if we have a cached raw mask for this image with these parameters
    if (this.maskCache.has(cacheKey)) {
      console.log('Using cached raw mask for:', cacheKey)
      return this.maskCache.get(cacheKey)
    }

    console.log('No cached raw mask found for:', cacheKey, 'generating new one...')

    if (!this.modelLoaded) {
      await this.initialize()
    }

    this.isComputingMask = true

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

          // Cache the raw mask with sensitivity-only key
          this.maskCache.set(cacheKey, maskData)
          this.currentMask = maskData
          this.isComputingMask = false

          resolve(maskData)
        } else {
          this.isComputingMask = false
          reject(new Error('Failed to generate segmentation mask'))
        }
      })

      this.selfieSegmentation.send({ image: canvas })
        .catch((error) => {
          this.isComputingMask = false
          reject(error)
        })
    })
  }

  clearMaskCache() {
    this.maskCache.clear()
    this.featheredMaskCache.clear()
    this.currentMask = null
  }

  isFeatherComputing() {
    return this.isApplyingFeather
  }

  getCachedFeatheredMask(rawMaskCacheKey, featherAmount, featherEnabled) {
    if (!featherEnabled) {
      return null // No feathered mask needed when disabled
    }
    const cacheKey = `${rawMaskCacheKey}_f${featherAmount}_e${featherEnabled}`
    return this.featheredMaskCache.get(cacheKey) || null
  }

  setCachedFeatheredMask(rawMaskCacheKey, featherAmount, featherEnabled, featheredMask) {
    const cacheKey = `${rawMaskCacheKey}_f${featherAmount}_e${featherEnabled}`
    this.featheredMaskCache.set(cacheKey, featheredMask)
  }

  getCachedRawMask(width, height, sensitivity) {
    const cacheKey = `${width}x${height}_s${sensitivity}`
    return this.maskCache.get(cacheKey) || null
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
 * Applies feathering/smoothing to a mask and caches the result
 * This is an async operation to not block the UI
 * @param {ImageData} rawMask - The raw segmentation mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} sensitivity - Sensitivity threshold
 * @param {number} featherAmount - Feather radius in pixels
 * @param {boolean} featherEnabled - Whether feathering is enabled
 * @returns {Promise<{featheredMask: ImageData|null, isComputing: boolean}>}
 */
async function applyFeatheringToMask(rawMask, width, height, sensitivity, featherAmount, featherEnabled) {
  const processor = getProcessor()
  
  // Create cache key for raw mask (dimensions + sensitivity)
  const rawMaskCacheKey = `${width}x${height}_s${sensitivity}`
  
  // If feathering is disabled, return null (will use raw mask)
  if (!featherEnabled || featherAmount <= 0) {
    return { featheredMask: null, isComputing: false }
  }
  
  // Check if we have a cached feathered mask
  const cachedFeatheredMask = processor.getCachedFeatheredMask(rawMaskCacheKey, featherAmount, featherEnabled)
  if (cachedFeatheredMask) {
    console.log('Using cached feathered mask for:', `${rawMaskCacheKey}_f${featherAmount}_e${featherEnabled}`)
    return { featheredMask: cachedFeatheredMask, isComputing: false }
  }
  
  // Check if feathering is currently being computed
  if (processor.isApplyingFeather) {
    return { featheredMask: null, isComputing: true }
  }
  
  // Compute the feathered mask asynchronously
  processor.isApplyingFeather = true
  
  // Use setTimeout to yield to the main thread
  await new Promise(resolve => setTimeout(resolve, 0))
  
  try {
    const featheredMask = computeFeatheredMask(rawMask, width, height, sensitivity, featherAmount)
    
    // Cache the result
    processor.setCachedFeatheredMask(rawMaskCacheKey, featherAmount, featherEnabled, featheredMask)
    
    processor.isApplyingFeather = false
    return { featheredMask, isComputing: false }
  } catch (error) {
    console.error('Feathering computation failed:', error)
    processor.isApplyingFeather = false
    return { featheredMask: null, isComputing: false }
  }
}

/**
 * Computes a feathered version of the mask (synchronous, for internal use)
 * @param {ImageData} mask - The raw segmentation mask
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} threshold - The threshold value
 * @param {number} featherAmount - Feather radius in pixels
 * @returns {ImageData} - Feathered mask
 */
function computeFeatheredMask(mask, width, height, threshold, featherAmount) {
  const result = new Uint8ClampedArray(mask.data)
  
  // Create a smoothed version of the mask using Gaussian-like blur
  const smoothedMask = new Uint8ClampedArray(mask.data.length)
  
  // First pass: compute smoothed mask values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const maskValue = mask.data[idx]
      
      // Only compute smoothed value for pixels near the edge
      if (Math.abs(maskValue - threshold) < featherAmount * 20) {
        let totalWeight = 0
        let weightedSum = 0
        
        // Use a larger kernel for better quality
        const kernelRadius = featherAmount * 2
        
        for (let dy = -kernelRadius; dy <= kernelRadius; dy++) {
          for (let dx = -kernelRadius; dx <= kernelRadius; dx++) {
            const ny = y + dy
            const nx = x + dx
            
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const distance = Math.sqrt(dx * dx + dy * dy)
              if (distance <= kernelRadius) {
                const weight = Math.exp(-(distance * distance) / (2 * (featherAmount * featherAmount)))
                const neighborIdx = (ny * width + nx) * 4
                const neighborValue = mask.data[neighborIdx]
                
                weightedSum += neighborValue * weight
                totalWeight += weight
              }
            }
          }
        }
        
        smoothedMask[idx] = weightedSum / totalWeight
        smoothedMask[idx + 1] = smoothedMask[idx]     // Keep grayscale
        smoothedMask[idx + 2] = smoothedMask[idx]
        smoothedMask[idx + 3] = 255                   // Alpha
      } else {
        // Keep original values for non-edge pixels
        smoothedMask[idx] = maskValue
        smoothedMask[idx + 1] = maskValue
        smoothedMask[idx + 2] = maskValue
        smoothedMask[idx + 3] = 255
      }
    }
  }
  
  // Return as ImageData
  return new ImageData(smoothedMask, width, height)
}

/**
 * Removes background from an image using MediaPipe segmentation mask
 * @param {ImageData} imageData - The original image data
 * @param {ImageData} mask - The segmentation mask from MediaPipe (0-255 values)
 * @param {number} threshold - Sensitivity threshold (0-255, default 128)
 * @param {boolean} featherEdges - Whether to apply edge feathering
 * @param {number} featherAmount - Feather amount in pixels (1-20)
 * @param {ImageData} featheredMask - Optional pre-computed feathered mask (from cache)
 * @returns {ImageData} - Image with background removed (black background)
 */
function removeBackground(imageData, mask, threshold = 128, featherEdges = false, featherAmount = 5, featheredMask = null) {
  const result = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  )

  // Use feathered mask if provided, otherwise use raw mask
  const maskToUse = featheredMask || mask

  // Apply binary thresholding based on mask sensitivity
  for (let i = 0; i < result.data.length; i += 4) {
    const maskIndex = Math.floor(i / 4)
    const maskValue = maskToUse.data[maskIndex * 4] // Mask is grayscale, so use red channel
    
    // If mask value is below threshold, set pixel to black (background)
    if (maskValue < threshold) {
      result.data[i] = 0     // R
      result.data[i + 1] = 0 // G
      result.data[i + 2] = 0 // B
      // Alpha remains unchanged to preserve transparency
    }
  }

  return result
}

/**
 * Applies feathering directly to image data (legacy function, kept for compatibility)
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
 * @param {number} sensitivity - Mask sensitivity threshold (0-255)
 * @returns {Promise<ImageData>} - Promise that resolves with the segmentation mask
 */
function generateMask(imageData, sensitivity = 128) {
  return getProcessor().generateMask(imageData, sensitivity)
}

function isMaskComputing() {
  return getProcessor().isComputingMask
}

function isFeatherComputing() {
  return getProcessor().isApplyingFeather
}

function getCachedRawMask(width, height, sensitivity) {
  const processor = getProcessor()
  return processor.getCachedRawMask(width, height, sensitivity)
}

/**
 * Test function to verify mask caching is working
 * @returns {Object} - Object with cache statistics
 */
function getMaskCacheStats() {
  const processor = getProcessor()
  return {
    rawMaskCacheSize: processor.maskCache.size,
    featheredMaskCacheSize: processor.featheredMaskCache.size,
    isComputing: processor.isComputingMask,
    isFeathering: processor.isApplyingFeather,
    currentMask: processor.currentMask ? `${processor.currentMask.width}x${processor.currentMask.height}` : null
  }
}

/**
 * Smart mask computation that caches masks based on image content and parameters
 * @param {ImageData} imageData - The image data to process
 * @param {number} sensitivity - Mask sensitivity threshold (0-255)
 * @param {boolean} backgroundRemovalEnabled - Whether background removal is enabled
 * @returns {Promise<{mask: ImageData|null, isComputing: boolean}>} - Object with mask and computing status
 */
async function computeMaskSmart(imageData, sensitivity, backgroundRemovalEnabled) {
  if (!backgroundRemovalEnabled) {
    return { mask: null, isComputing: false }
  }

  // Check if we already have a cached raw mask for these parameters
  const cachedMask = getCachedRawMask(
    imageData.width, 
    imageData.height, 
    sensitivity
  )

  if (cachedMask) {
    return { mask: cachedMask, isComputing: false }
  }

  // Check if mask is currently being computed
  const isCurrentlyComputing = isMaskComputing()
  
  if (isCurrentlyComputing) {
    // Return null mask but indicate we're computing
    return { mask: null, isComputing: true }
  }

  // Generate new mask with the current parameters
  try {
    const mask = await generateMask(imageData, sensitivity)
    return { mask, isComputing: false }
  } catch (error) {
    console.error('Mask generation failed:', error)
    return { mask: null, isComputing: false }
  }
}

export {
  getProcessor,
  removeBackground,
  isBackgroundRemovalAvailable,
  getCachedMask,
  clearMaskCache,
  generateMask,
  isMaskComputing,
  isFeatherComputing,
  getCachedRawMask,
  applyFeatheringToMask,
  computeFeatheredMask,
  computeMaskSmart,
  getMaskCacheStats
}