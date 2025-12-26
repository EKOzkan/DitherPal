// RGB processing functions for multi-color dithering
import { findNearestColor } from './palettes';

// Apply RGB palette mapping to dithered grayscale image
// This function takes a grayscale dithered image and maps it to a palette
export function applyPaletteMapping(imageData, palette, useBrightnessMapping = true) {
  const width = imageData.width;
  const height = imageData.height;
  const srcData = imageData.data;
  const out = new ImageData(width, height);
  const outData = out.data;
  
  for (let i = 0; i < srcData.length; i += 4) {
    const brightness = (srcData[i] + srcData[i + 1] + srcData[i + 2]) / 3;
    
    if (useBrightnessMapping) {
      // Map brightness to palette colors
      // Find the color in palette that best matches this brightness level
      const paletteColor = findNearestColor(brightness, brightness, brightness, palette);
      outData[i] = paletteColor[0];
      outData[i + 1] = paletteColor[1];
      outData[i + 2] = paletteColor[2];
    } else {
      // Direct mapping - use the first color for black, last for white, interpolate in between
      const paletteIndex = Math.floor((brightness / 255) * (palette.length - 1));
      const paletteColor = palette[paletteIndex];
      outData[i] = paletteColor[0];
      outData[i + 1] = paletteColor[1];
      outData[i + 2] = paletteColor[2];
    }
    
    outData[i + 3] = srcData[i + 3]; // Preserve alpha
  }
  
  return out;
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
    const paletteColor = findNearestColor(brightness, brightness, brightness, palette);
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
    const paletteColor = findNearestColor(brightness, brightness, brightness, palette);
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
    const paletteColor = findNearestColor(brightness, brightness, brightness, palette);
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
        const paletteColor = findNearestColor(brightness, brightness, brightness, palette);
        outData[i] = paletteColor[0];
        outData[i + 1] = paletteColor[1];
        outData[i + 2] = paletteColor[2];
      } else {
        const paletteColor = findNearestColor(0, 0, 0, palette);
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