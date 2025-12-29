/**
 * Web Worker for fast, non-blocking edge feathering using Box Blur
 * Box blur is 10-100x faster than Gaussian blur and provides good quality
 * for edge smoothing when applied in multiple passes.
 */

/**
 * Fast box blur using separable convolution (horizontal + vertical passes)
 * This is much faster than 2D Gaussian blur: O(n*m) vs O(n*m*k²)
 * @param {Uint8ClampedArray} source - Source pixel data
 * @param {Uint8ClampedArray} target - Target pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} radius - Blur radius in pixels
 */
function boxBlurHorizontal(source, target, width, height, radius) {
  const diameter = 2 * radius + 1
  
  for (let y = 0; y < height; y++) {
    let sum = 0
    let count = 0
    
    // Initialize window
    for (let x = -radius; x <= radius; x++) {
      if (x >= 0 && x < width) {
        const idx = (y * width + x) * 4
        sum += source[idx]
        count++
      }
    }
    
    // Process each pixel in the row
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      
      // Average value
      target[idx] = sum / count
      target[idx + 1] = target[idx]
      target[idx + 2] = target[idx]
      target[idx + 3] = 255
      
      // Slide window: remove left pixel, add right pixel
      const leftX = x - radius
      const rightX = x + radius + 1
      
      if (leftX >= 0) {
        const leftIdx = (y * width + leftX) * 4
        sum -= source[leftIdx]
        count--
      }
      
      if (rightX < width) {
        const rightIdx = (y * width + rightX) * 4
        sum += source[rightIdx]
        count++
      }
    }
  }
}

function boxBlurVertical(source, target, width, height, radius) {
  const diameter = 2 * radius + 1
  
  for (let x = 0; x < width; x++) {
    let sum = 0
    let count = 0
    
    // Initialize window
    for (let y = -radius; y <= radius; y++) {
      if (y >= 0 && y < height) {
        const idx = (y * width + x) * 4
        sum += source[idx]
        count++
      }
    }
    
    // Process each pixel in the column
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * 4
      
      // Average value
      target[idx] = sum / count
      target[idx + 1] = target[idx]
      target[idx + 2] = target[idx]
      target[idx + 3] = 255
      
      // Slide window: remove top pixel, add bottom pixel
      const topY = y - radius
      const bottomY = y + radius + 1
      
      if (topY >= 0) {
        const topIdx = (topY * width + x) * 4
        sum -= source[topIdx]
        count--
      }
      
      if (bottomY < height) {
        const bottomIdx = (bottomY * width + x) * 4
        sum += source[bottomIdx]
        count++
      }
    }
  }
}

/**
 * Apply box blur multiple times for smoother results
 * 3 iterations of box blur approximates Gaussian blur well
 * @param {Uint8ClampedArray} data - Pixel data to blur
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} radius - Blur radius in pixels
 * @param {number} iterations - Number of blur passes (default: 3)
 * @returns {Uint8ClampedArray} - Blurred pixel data
 */
function multiPassBoxBlur(data, width, height, radius, iterations = 3) {
  // Clamp radius to reasonable range
  radius = Math.max(1, Math.min(20, Math.round(radius)))
  
  let source = new Uint8ClampedArray(data)
  let target = new Uint8ClampedArray(data.length)
  
  for (let i = 0; i < iterations; i++) {
    // Horizontal pass
    boxBlurHorizontal(source, target, width, height, radius)
    
    // Vertical pass (swap buffers)
    const temp = source
    source = target
    target = temp
    
    boxBlurVertical(source, target, width, height, radius)
    
    // Swap buffers for next iteration
    const temp2 = source
    source = target
    target = temp2
  }
  
  return source
}

/**
 * Optimized feathering that only processes edge pixels
 * @param {Uint8ClampedArray} maskData - Input mask data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} threshold - Edge detection threshold
 * @param {number} featherAmount - Feather radius in pixels
 * @returns {Uint8ClampedArray} - Feathered mask data
 */
function computeFeatheredMask(maskData, width, height, threshold, featherAmount) {
  // For small feather amounts, use simple blur
  if (featherAmount <= 2) {
    return multiPassBoxBlur(maskData, width, height, featherAmount, 2)
  }
  
  // For larger feather amounts, detect edges first then blur
  const result = new Uint8ClampedArray(maskData)
  
  // Step 1: Identify edge pixels (pixels near the threshold)
  const isEdgePixel = new Uint8Array(width * height)
  const edgeThreshold = featherAmount * 15 // Pixels within this range of threshold
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const maskValue = maskData[idx]
      
      // Mark as edge pixel if near threshold
      if (Math.abs(maskValue - threshold) < edgeThreshold) {
        isEdgePixel[y * width + x] = 1
      }
    }
  }
  
  // Step 2: Apply box blur to entire mask (fast)
  const blurred = multiPassBoxBlur(maskData, width, height, featherAmount, 3)
  
  // Step 3: Blend blurred values only at edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const pixelIdx = y * width + x
      
      if (isEdgePixel[pixelIdx]) {
        // Use blurred value for edge pixels
        result[idx] = blurred[idx]
        result[idx + 1] = blurred[idx]
        result[idx + 2] = blurred[idx]
        result[idx + 3] = 255
      } else {
        // Keep original value for non-edge pixels
        result[idx] = maskData[idx]
        result[idx + 1] = maskData[idx]
        result[idx + 2] = maskData[idx]
        result[idx + 3] = 255
      }
    }
  }
  
  return result
}

// Worker message handler
self.onmessage = function(event) {
  const { maskData, width, height, threshold, featherAmount, requestId } = event.data
  
  try {
    // Validate input
    if (!maskData || !width || !height) {
      throw new Error('Invalid input parameters')
    }
    
    if (featherAmount < 0 || featherAmount > 20) {
      throw new Error('Feather amount must be between 0 and 20')
    }
    
    // Convert to Uint8ClampedArray if needed
    const maskArray = maskData instanceof Uint8ClampedArray 
      ? maskData 
      : new Uint8ClampedArray(maskData)
    
    // Compute feathered mask
    const startTime = performance.now()
    const featheredData = computeFeatheredMask(
      maskArray, 
      width, 
      height, 
      threshold, 
      featherAmount
    )
    const endTime = performance.now()
    
    console.log(`✅ Feathering completed in ${Math.round(endTime - startTime)}ms`)
    
    // Send result back to main thread
    self.postMessage({
      success: true,
      featheredData: featheredData,
      requestId: requestId,
      processingTime: endTime - startTime
    }, [featheredData.buffer]) // Transfer ownership for performance
    
  } catch (error) {
    console.error('❌ Feathering worker error:', error)
    // Send error back to main thread
    self.postMessage({
      success: false,
      error: error.message || 'Unknown feathering error',
      requestId: requestId
    })
  }
}
