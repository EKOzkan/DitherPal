// RGB processing functions for multi-color dithering

// Helper function to get palette color by brightness
function getPaletteColorByBrightness(brightness, palette) {
  // Sort palette colors by brightness for proper grayscale-to-color mapping
  const sortedPalette = [...palette].map((color) => ({
    color,
    brightness: color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114
  })).sort((a, b) => a.brightness - b.brightness);
  
  // Map brightness (0-255) to palette index
  const paletteIndex = Math.floor((brightness / 255) * (sortedPalette.length - 1));
  return sortedPalette[paletteIndex].color;
}

// Apply RGB palette mapping to dithered grayscale image
// This function takes a grayscale dithered image and maps it to a palette
export function applyPaletteMapping(imageData, palette, useBrightnessMapping = true) {
  const width = imageData.width;
  const height = imageData.height;
  const srcData = imageData.data;
  const out = new ImageData(width, height);
  const outData = out.data;
  
  if (useBrightnessMapping) {
    // Sort palette colors by brightness for proper grayscale-to-color mapping
    const sortedPalette = [...palette].map((color, index) => ({
      color,
      index,
      brightness: color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114
    })).sort((a, b) => a.brightness - b.brightness);
    
    for (let i = 0; i < srcData.length; i += 4) {
      const brightness = (srcData[i] + srcData[i + 1] + srcData[i + 2]) / 3;
      
      // Map brightness (0-255) to palette index
      const paletteIndex = Math.floor((brightness / 255) * (sortedPalette.length - 1));
      const paletteColor = sortedPalette[paletteIndex].color;
      
      outData[i] = paletteColor[0];
      outData[i + 1] = paletteColor[1];
      outData[i + 2] = paletteColor[2];
      outData[i + 3] = srcData[i + 3]; // Preserve alpha
    }
  } else {
    // Direct mapping - use the first color for black, last for white, interpolate in between
    for (let i = 0; i < srcData.length; i += 4) {
      const brightness = (srcData[i] + srcData[i + 1] + srcData[i + 2]) / 3;
      const paletteIndex = Math.floor((brightness / 255) * (palette.length - 1));
      const paletteColor = palette[paletteIndex];
      outData[i] = paletteColor[0];
      outData[i + 1] = paletteColor[1];
      outData[i + 2] = paletteColor[2];
      outData[i + 3] = srcData[i + 3]; // Preserve alpha
    }
  }
  
  return out;
}

function sortPaletteByBrightness(palette) {
  return [...palette]
    .map((color) => ({
      color,
      brightness: color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114
    }))
    .sort((a, b) => a.brightness - b.brightness)
}

function nearestIndex(value, levels) {
  let bestIdx = 0
  let bestDist = Infinity

  for (let i = 0; i < levels.length; i++) {
    const d = Math.abs(value - levels[i])
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }

  return bestIdx
}

function errorDiffuseToPaletteByBrightness(imageData, palette, kernel, serpentine = false) {
  const width = imageData.width
  const height = imageData.height
  const src = imageData.data

  const sorted = sortPaletteByBrightness(palette)
  if (sorted.length === 0) return null

  const levels = sorted.map((p) => p.brightness)
  const colors = sorted.map((p) => p.color)

  const lum = new Float32Array(width * height)
  const alpha = new Uint8ClampedArray(width * height)
  for (let i = 0, p = 0; p < lum.length; i += 4, p++) {
    lum[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]
    alpha[p] = src[i + 3]
  }

  const out = new ImageData(width, height)
  const outData = out.data

  for (let y = 0; y < height; y++) {
    const dir = serpentine && y % 2 === 1 ? -1 : 1
    const xStart = dir === 1 ? 0 : width - 1
    const xEnd = dir === 1 ? width : -1

    for (let x = xStart; x !== xEnd; x += dir) {
      const p = y * width + x
      const oldVal = lum[p]
      const qIdx = nearestIndex(oldVal, levels)
      const newVal = levels[qIdx]
      const err = oldVal - newVal

      lum[p] = newVal

      for (const [dx, dy, w] of kernel) {
        const nx = x + dx * dir
        const ny = y + dy
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          lum[ny * width + nx] += err * w
        }
      }

      const i4 = p * 4
      const [r, g, b] = colors[qIdx]
      outData[i4] = r
      outData[i4 + 1] = g
      outData[i4 + 2] = b
      outData[i4 + 3] = alpha[p]
    }
  }

  return out
}

function buildBayerMatrix(size) {
  let M = [
    [0, 2],
    [3, 1]
  ]
  let n = 2
  while (n < size) {
    const M2 = new Array(n * 2).fill(0).map(() => new Array(n * 2).fill(0))
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = M[y][x] * 4
        M2[y][x] = v + 0
        M2[y][x + n] = v + 2
        M2[y + n][x] = v + 3
        M2[y + n][x + n] = v + 1
      }
    }
    M = M2
    n *= 2
  }
  return M
}

function orderedDitherToPaletteByBrightness(imageData, palette, matrixSize) {
  const width = imageData.width
  const height = imageData.height
  const src = imageData.data

  const sorted = sortPaletteByBrightness(palette)
  if (sorted.length === 0) return null

  const levels = sorted.map((p) => p.brightness)
  const colors = sorted.map((p) => p.color)

  const matrix = buildBayerMatrix(matrixSize)
  const mSize = matrix.length

  const out = new ImageData(width, height)
  const outData = out.data

  const step = 255 / Math.max(1, levels.length - 1)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]
      const t = (matrix[y % mSize][x % mSize] / (mSize * mSize) - 0.5) * step
      const qIdx = nearestIndex(lum + t, levels)
      const [r, g, b] = colors[qIdx]
      outData[i] = r
      outData[i + 1] = g
      outData[i + 2] = b
      outData[i + 3] = src[i + 3]
    }
  }

  return out
}

function randomOrderedToPaletteByBrightness(imageData, palette, seed = 1) {
  const width = imageData.width
  const height = imageData.height
  const src = imageData.data

  const sorted = sortPaletteByBrightness(palette)
  if (sorted.length === 0) return null

  const levels = sorted.map((p) => p.brightness)
  const colors = sorted.map((p) => p.color)

  const noiseSize = 32
  const noise = new Float32Array(noiseSize * noiseSize)
  let rand = seed
  const random = () => {
    rand = (rand * 16807) % 2147483647
    return rand / 2147483647
  }

  for (let i = 0; i < noise.length; i++) {
    noise[i] = random() * 255
  }

  const out = new ImageData(width, height)
  const outData = out.data

  const step = 255 / Math.max(1, levels.length - 1)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]
      const n = noise[(y % noiseSize) * noiseSize + (x % noiseSize)]
      const t = ((n / 255) - 0.5) * step
      const qIdx = nearestIndex(lum + t, levels)
      const [r, g, b] = colors[qIdx]
      outData[i] = r
      outData[i + 1] = g
      outData[i + 2] = b
      outData[i + 3] = src[i + 3]
    }
  }

  return out
}

export function ditherToPaletteByBrightness(imageData, palette, algorithmName) {
  if (!palette || palette.length === 0) return null

  switch (algorithmName) {
    case 'floydSteinberg':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 7 / 16],
        [-1, 1, 3 / 16],
        [0, 1, 5 / 16],
        [1, 1, 1 / 16]
      ])

    case 'floydSteinbergSerpentine':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 7 / 16],
        [-1, 1, 3 / 16],
        [0, 1, 5 / 16],
        [1, 1, 1 / 16]
      ], true)

    case 'falseFloydSteinberg':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 3 / 8],
        [0, 1, 3 / 8],
        [1, 1, 2 / 8]
      ])

    case 'atkinson':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 1 / 8],
        [2, 0, 1 / 8],
        [-1, 1, 1 / 8],
        [0, 1, 1 / 8],
        [1, 1, 1 / 8],
        [0, 2, 1 / 8]
      ])

    case 'jarvisJudiceNinke':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 7 / 48],
        [2, 0, 5 / 48],
        [-2, 1, 3 / 48],
        [-1, 1, 5 / 48],
        [0, 1, 7 / 48],
        [1, 1, 5 / 48],
        [2, 1, 3 / 48],
        [-2, 2, 1 / 48],
        [-1, 2, 3 / 48],
        [0, 2, 5 / 48],
        [1, 2, 3 / 48],
        [2, 2, 1 / 48]
      ])

    case 'stucki':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 8 / 42],
        [2, 0, 4 / 42],
        [-2, 1, 2 / 42],
        [-1, 1, 4 / 42],
        [0, 1, 8 / 42],
        [1, 1, 4 / 42],
        [2, 1, 2 / 42],
        [-2, 2, 1 / 42],
        [-1, 2, 2 / 42],
        [0, 2, 4 / 42],
        [1, 2, 2 / 42],
        [2, 2, 1 / 42]
      ])

    case 'burkes':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 8 / 32],
        [2, 0, 4 / 32],
        [-2, 1, 2 / 32],
        [-1, 1, 4 / 32],
        [0, 1, 8 / 32],
        [1, 1, 4 / 32],
        [2, 1, 2 / 32]
      ])

    case 'sierra':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 5 / 32],
        [2, 0, 3 / 32],
        [-2, 1, 2 / 32],
        [-1, 1, 4 / 32],
        [0, 1, 5 / 32],
        [1, 1, 4 / 32],
        [2, 1, 2 / 32],
        [-1, 2, 2 / 32],
        [0, 2, 3 / 32],
        [1, 2, 2 / 32]
      ])

    case 'twoRowSierra':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 4 / 16],
        [2, 0, 3 / 16],
        [-2, 1, 1 / 16],
        [-1, 1, 2 / 16],
        [0, 1, 3 / 16],
        [1, 1, 2 / 16],
        [2, 1, 1 / 16]
      ])

    case 'sierraLite':
      return errorDiffuseToPaletteByBrightness(imageData, palette, [
        [1, 0, 2 / 4],
        [-1, 1, 1 / 4],
        [0, 1, 2 / 4]
      ])

    case 'bayerOrdered':
      return orderedDitherToPaletteByBrightness(imageData, palette, 8)

    case 'bayerOrdered4x4':
      return orderedDitherToPaletteByBrightness(imageData, palette, 4)

    case 'bayerOrdered16x16':
      return orderedDitherToPaletteByBrightness(imageData, palette, 16)

    case 'randomOrdered':
      return randomOrderedToPaletteByBrightness(imageData, palette, 1)

    default:
      return null
  }
}

// RGB versions of dithering algorithms that work with palettes
// These functions take the original color image, convert to grayscale,
// apply dithering, then map to palette

export function floydSteinbergRGB(imageData, palette) {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  // Build a grayscale working buffer so diffusion operates on luminance
  const gray = new Float32Array(width * height);
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
    gray[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    alpha[p] = src[i + 3];
  }

  // Error diffusion
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const oldVal = gray[p];
      const newVal = oldVal < 128 ? 0 : 255;
      const err = oldVal - newVal;
      gray[p] = newVal;

      if (x + 1 < width) gray[p + 1] += err * 7 / 16;
      if (y + 1 < height) {
        if (x > 0) gray[p + width - 1] += err * 3 / 16;
        gray[p + width] += err * 5 / 16;
        if (x + 1 < width) gray[p + width + 1] += err * 1 / 16;
      }
    }
  }

  // Write back to a new ImageData with palette mapping
  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const brightness = Math.max(0, Math.min(255, Math.round(gray[p])));
    const paletteColor = getPaletteColorByBrightness(brightness, palette);
    out.data[i] = paletteColor[0];
    out.data[i + 1] = paletteColor[1];
    out.data[i + 2] = paletteColor[2];
    out.data[i + 3] = alpha[p];
  }
  return out;
}

export function atkinsonRGB(imageData, palette) {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  const gray = new Float32Array(width * height);
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
    gray[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    alpha[p] = src[i + 3];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const oldVal = gray[p];
      const newVal = oldVal < 128 ? 0 : 255;
      const err = (oldVal - newVal) / 8; // distribute equally to 6 neighbors
      gray[p] = newVal;

      if (x + 1 < width) gray[p + 1] += err;
      if (x + 2 < width) gray[p + 2] += err;
      if (y + 1 < height) {
        const r1 = p + width;
        if (x > 0) gray[r1 - 1] += err;
        gray[r1] += err;
        if (x + 1 < width) gray[r1 + 1] += err;
      }
      if (y + 2 < height) gray[p + 2 * width] += err;
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const brightness = Math.max(0, Math.min(255, Math.round(gray[p])));
    const paletteColor = getPaletteColorByBrightness(brightness, palette);
    out.data[i] = paletteColor[0];
    out.data[i + 1] = paletteColor[1];
    out.data[i + 2] = paletteColor[2];
    out.data[i + 3] = alpha[p];
  }
  return out;
}

export function jarvisJudiceNinkeRGB(imageData, palette) {
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;

  const gray = new Float32Array(width * height);
  const alpha = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; p < gray.length; i += 4, p++) {
    gray[p] = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
    alpha[p] = src[i + 3];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = y * width + x;
      const oldVal = gray[p];
      const newVal = oldVal < 128 ? 0 : 255;
      const err = oldVal - newVal;
      gray[p] = newVal;

      // row 0
      if (x + 1 < width) gray[p + 1] += err * (7 / 48);
      if (x + 2 < width) gray[p + 2] += err * (5 / 48);
      // row 1
      if (y + 1 < height) {
        const r1 = p + width;
        if (x > 1) gray[r1 - 2] += err * (3 / 48);
        if (x > 0) gray[r1 - 1] += err * (5 / 48);
        gray[r1] += err * (7 / 48);
        if (x + 1 < width) gray[r1 + 1] += err * (5 / 48);
        if (x + 2 < width) gray[r1 + 2] += err * (3 / 48);
      }
      // row 2
      if (y + 2 < height) {
        const r2 = p + width * 2;
        if (x > 1) gray[r2 - 2] += err * (1 / 48);
        if (x > 0) gray[r2 - 1] += err * (3 / 48);
        gray[r2] += err * (5 / 48);
        if (x + 1 < width) gray[r2 + 1] += err * (3 / 48);
        if (x + 2 < width) gray[r2 + 2] += err * (1 / 48);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const brightness = Math.max(0, Math.min(255, Math.round(gray[p])));
    const paletteColor = getPaletteColorByBrightness(brightness, palette);
    out.data[i] = paletteColor[0];
    out.data[i + 1] = paletteColor[1];
    out.data[i + 2] = paletteColor[2];
    out.data[i + 3] = alpha[p];
  }
  return out;
}

export function bayerOrderedRGB(imageData, palette, matrixSize = 8) {
  // Build Bayer matrix
  function buildBayerMatrix(size) {
    let M = [
      [0, 2],
      [3, 1]
    ];
    let n = 2;
    while (n < size) {
      const M2 = new Array(n * 2).fill(0).map(() => new Array(n * 2).fill(0));
      for (let y = 0; y < n; y++) {
        for (let x = 0; x < n; x++) {
          const v = M[y][x] * 4;
          M2[y][x] = v + 0;
          M2[y][x + n] = v + 2;
          M2[y + n][x] = v + 3;
          M2[y + n][x + n] = v + 1;
        }
      }
      M = M2;
      n *= 2;
    }
    return M;
  }

  const matrix = buildBayerMatrix(matrixSize);
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new ImageData(width, height);
  const outData = out.data;
  const mSize = matrix.length;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lum = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
      if (lum > 10) {
        const threshold = (matrix[y % mSize][x % mSize] / (mSize * mSize)) * 255;
        const brightness = lum < threshold ? 0 : 255;
        const paletteColor = getPaletteColorByBrightness(brightness, palette);
        outData[i] = paletteColor[0];
        outData[i + 1] = paletteColor[1];
        outData[i + 2] = paletteColor[2];
      } else {
        const paletteColor = getPaletteColorByBrightness(0, palette);
        outData[i] = paletteColor[0];
        outData[i + 1] = paletteColor[1];
        outData[i + 2] = paletteColor[2];
      }
      outData[i + 3] = 255;
    }
  }
  return out;
}

// Generic RGB dithering function that wraps any grayscale algorithm
export function createRGBDitheringAlgorithm(grayscaleAlgorithm) {
  return function(imageData, palette) {
    // First apply the grayscale algorithm
    const grayscaleResult = grayscaleAlgorithm(imageData);
    
    // Then map to palette
    return applyPaletteMapping(grayscaleResult, palette, true);
  };
}