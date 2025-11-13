// None
export const none = (imageData) => imageData;

// Floyd-Steinberg
export const floydSteinberg = (imageData) => {
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

  // Write back to a new ImageData (grayscale RGB)
  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// False Floyd-Steinberg (fast diffusion)
export const falseFloydSteinberg = (imageData) => {
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

      if (x + 1 < width) gray[p + 1] += err * (3 / 8);
      if (y + 1 < height) {
        gray[p + width] += err * (3 / 8);
        if (x + 1 < width) gray[p + width + 1] += err * (2 / 8);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Floyd-Steinberg (Serpentine scanning)
export const floydSteinbergSerpentine = (imageData) => {
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
    const dir = y % 2 === 0 ? 1 : -1;
    const xStart = dir === 1 ? 0 : width - 1;
    const xEnd = dir === 1 ? width : -1;

    for (let x = xStart; x !== xEnd; x += dir) {
      const p = y * width + x;
      const oldVal = gray[p];
      const newVal = oldVal < 128 ? 0 : 255;
      const err = oldVal - newVal;
      gray[p] = newVal;

      const xn = x + dir;
      if (xn >= 0 && xn < width) gray[p + dir] += err * (7 / 16);

      if (y + 1 < height) {
        const r1 = p + width;
        const xb = x - dir;
        if (xb >= 0 && xb < width) gray[r1 - dir] += err * (3 / 16);
        gray[r1] += err * (5 / 16);
        if (xn >= 0 && xn < width) gray[r1 + dir] += err * (1 / 16);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Ordered dithering using Bayer matrices (4x4, 8x8, 16x16)
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

function applyOrderedDither(imageData, matrix) {
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
        const v = lum < threshold ? 0 : 255;
        outData[i] = outData[i + 1] = outData[i + 2] = v;
      } else {
        outData[i] = outData[i + 1] = outData[i + 2] = 0;
      }
      outData[i + 3] = 255;
    }
  }
  return out;
}

// Bayer Ordered (8x8)
export const bayerOrdered = (imageData) => {
  const matrix = buildBayerMatrix(8);
  return applyOrderedDither(imageData, matrix);
};

// Bayer Ordered (4x4)
export const bayerOrdered4x4 = (imageData) => {
  const matrix = buildBayerMatrix(4);
  return applyOrderedDither(imageData, matrix);
};

// Bayer Ordered (16x16)
export const bayerOrdered16x16 = (imageData) => {
  const matrix = buildBayerMatrix(16);
  return applyOrderedDither(imageData, matrix);
};

// Random Ordered
export const randomOrdered = (imageData, seed = 1) => {
    const data = imageData.data;
    const width = imageData.width;
    // Pre-generate a smaller noise pattern that we'll tile
    const noiseSize = 32;
    const noise = new Array(noiseSize * noiseSize);
    let rand = seed;
    // Simple random number generator with seed
    const random = () => {
      rand = (rand * 16807) % 2147483647;
      return rand / 2147483647;
    };
    
    // Generate noise pattern
    for (let i = 0; i < noise.length; i++) {
      noise[i] = random() * 255;
    }
    
    // Apply dithering
    for (let i = 0; i < data.length; i += 4) {
      const x = (i/4) % width;
      const y = Math.floor((i/4) / width);
      const threshold = noise[(y % noiseSize) * noiseSize + (x % noiseSize)];
      
      for (let c = 0; c < 3; c++) {
        data[i + c] = data[i + c] < threshold ? 0 : 255;
      }
    }
    return imageData;
  };

// Atkinson
export const atkinson = (imageData) => {
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
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Jarvis-Judice-Ninke
export const jarvisJudiceNinke = (imageData) => {
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
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Stucki
export const stucki = (imageData) => {
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
      if (x + 1 < width) gray[p + 1] += err * (8 / 42);
      if (x + 2 < width) gray[p + 2] += err * (4 / 42);
      // row 1
      if (y + 1 < height) {
        const r1 = p + width;
        if (x > 1) gray[r1 - 2] += err * (2 / 42);
        if (x > 0) gray[r1 - 1] += err * (4 / 42);
        gray[r1] += err * (8 / 42);
        if (x + 1 < width) gray[r1 + 1] += err * (4 / 42);
        if (x + 2 < width) gray[r1 + 2] += err * (2 / 42);
      }
      // row 2
      if (y + 2 < height) {
        const r2 = p + width * 2;
        if (x > 1) gray[r2 - 2] += err * (1 / 42);
        if (x > 0) gray[r2 - 1] += err * (2 / 42);
        gray[r2] += err * (4 / 42);
        if (x + 1 < width) gray[r2 + 1] += err * (2 / 42);
        if (x + 2 < width) gray[r2 + 2] += err * (1 / 42);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Burkes
export const burkes = (imageData) => {
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
      if (x + 1 < width) gray[p + 1] += err * (8 / 32);
      if (x + 2 < width) gray[p + 2] += err * (4 / 32);
      // row 1
      if (y + 1 < height) {
        const r1 = p + width;
        if (x > 1) gray[r1 - 2] += err * (2 / 32);
        if (x > 0) gray[r1 - 1] += err * (4 / 32);
        gray[r1] += err * (8 / 32);
        if (x + 1 < width) gray[r1 + 1] += err * (4 / 32);
        if (x + 2 < width) gray[r1 + 2] += err * (2 / 32);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Sierra (3-row)
export const sierra = (imageData) => {
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
      if (x + 1 < width) gray[p + 1] += err * (5 / 32);
      if (x + 2 < width) gray[p + 2] += err * (3 / 32);
      // row 1
      if (y + 1 < height) {
        const r1 = p + width;
        if (x > 1) gray[r1 - 2] += err * (2 / 32);
        if (x > 0) gray[r1 - 1] += err * (4 / 32);
        gray[r1] += err * (5 / 32);
        if (x + 1 < width) gray[r1 + 1] += err * (4 / 32);
        if (x + 2 < width) gray[r1 + 2] += err * (2 / 32);
      }
      // row 2
      if (y + 2 < height) {
        const r2 = p + width * 2;
        if (x > 0) gray[r2 - 1] += err * (2 / 32);
        gray[r2] += err * (3 / 32);
        if (x + 1 < width) gray[r2 + 1] += err * (2 / 32);
      }
    }
  }

  const out = new ImageData(width, height);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[p])));
    out.data[i] = v;
    out.data[i + 1] = v;
    out.data[i + 2] = v;
    out.data[i + 3] = alpha[p];
  }
  return out;
};

// Sierra Lite
export const sierraLite = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const oldVal = data[idx + c];
        const newVal = oldVal < 128 ? 0 : 255;
        data[idx + c] = newVal;
        const err = (oldVal - newVal) / 4;

        if (x + 1 < width) data[idx + 4 + c] += err * 2;
        if (y + 1 < height) {
          if (x > 0) data[idx + width*4 - 4 + c] += err;
          data[idx + width*4 + c] += err * 2;
        }
      }
    }
  }
  return imageData;
};

// Two Row Sierra
export const twoRowSierra = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const oldVal = data[idx + c];
        const newVal = oldVal < 128 ? 0 : 255;
        data[idx + c] = newVal;
        const err = (oldVal - newVal) / 16;

        if (x + 1 < width) data[idx + 4 + c] += err * 4;
        if (x + 2 < width) data[idx + 8 + c] += err * 3;
        if (y + 1 < height) {
          if (x > 1) data[idx + width*4 - 8 + c] += err * 1;
          if (x > 0) data[idx + width*4 - 4 + c] += err * 2;
          data[idx + width*4 + c] += err * 3;
          if (x + 1 < width) data[idx + width*4 + 4 + c] += err * 2;
          if (x + 2 < width) data[idx + width*4 + 8 + c] += err * 1;
        }
      }
    }
  }
  return imageData;
};

// Bit Tone
export const bitTone = (imageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    const value = gray < 64 ? 0 : gray < 128 ? 85 : gray < 192 ? 170 : 255;
    data[i] = data[i+1] = data[i+2] = value;
  }
  return imageData;
};

// Mosaic
export const mosaic = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const tileSize = 4;

  for (let y = 0; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let ty = 0; ty < tileSize && y+ty < height; ty++) {
        for (let tx = 0; tx < tileSize && x+tx < width; tx++) {
          const idx = ((y+ty)*width + (x+tx)) * 4;
          r += data[idx];
          g += data[idx+1];
          b += data[idx+2];
          count++;
        }
      }
      
      r = Math.round(r/count);
      g = Math.round(g/count);
      b = Math.round(b/count);
      
      for (let ty = 0; ty < tileSize && y+ty < height; ty++) {
        for (let tx = 0; tx < tileSize && x+tx < width; tx++) {
          const idx = ((y+ty)*width + (x+tx)) * 4;
          data[idx] = r;
          data[idx+1] = g;
          data[idx+2] = b;
        }
      }
    }
  }
  return imageData;
};

// Checkers (with size parameter)
const checkers = (imageData, size) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      const isBlack = (Math.floor(x/size) + Math.floor(y/size)) % 2 === 0;
      const value = isBlack ? 0 : 255;
      for (let ty = y; ty < y+size && ty < height; ty++) {
        for (let tx = x; tx < x+size && tx < width; tx++) {
          const idx = (ty*width + tx) * 4;
          data[idx] = data[idx+1] = data[idx+2] = value;
        }
      }
    }
  }
  return imageData;
};

export const checkersSmall = (imageData) => checkers(imageData, 4);
export const checkersMedium = (imageData) => checkers(imageData, 8);
export const checkersLarge = (imageData) => checkers(imageData, 16);

// Radial Burst
export const radialBurst = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width/2;
  const centerY = height/2;
  const maxDist = Math.max(centerX, centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y*width + x) * 4;
      const dist = Math.hypot(x-centerX, y-centerY);
      const threshold = (dist/maxDist) * 255;
      for (let c = 0; c < 3; c++) {
        data[idx + c] = data[idx + c] < threshold ? 0 : 255;
      }
    }
  }
  return imageData;
};

// Vortex
export const vortex = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width/2;
  const centerY = height/2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y*width + x) * 4;
      const angle = Math.atan2(y-centerY, x-centerX) + Math.PI;
      const threshold = (angle / (2*Math.PI)) * 255;
      for (let c = 0; c < 3; c++) {
        data[idx + c] = data[idx + c] < threshold ? 0 : 255;
      }
    }
  }
  return imageData;
};

// Diamond
export const diamond = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const centerX = width/2;
  const centerY = height/2;
  const maxDist = centerX + centerY;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y*width + x) * 4;
      const dist = Math.abs(x-centerX) + Math.abs(y-centerY);
      const threshold = (dist/maxDist) * 255;
      for (let c = 0; c < 3; c++) {
        data[idx + c] = data[idx + c] < threshold ? 0 : 255;
      }
    }
  }
  return imageData;
};

// Wave
export const wave = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y*width + x) * 4;
      const waveVal = Math.sin((x+y)/10) * 127 + 128;
      for (let c = 0; c < 3; c++) {
        data[idx + c] = data[idx + c] < waveVal ? 0 : 255;
      }
    }
  }
  return imageData;
};

// Gridlock/Traffic
export const gridlockTraffic = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const gridSize = 10;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y*width + x) * 4;
      if (x % gridSize === 0 || y % gridSize === 0) {
        data[idx] = data[idx+1] = data[idx+2] = 0;
      }
    }
  }
  return imageData;
};

// Cross Plus Pattern
export const crossPlus = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const plusSize = 4; // Size of the plus pattern

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isPlus = (x % plusSize === plusSize/2) || (y % plusSize === plusSize/2);
      const luminance = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
      const threshold = isPlus ? 192 : 64; // Different thresholds for plus pattern vs background
      
      const value = luminance < threshold ? 0 : 255;
      data[idx] = data[idx+1] = data[idx+2] = value;
    }
  }
  return imageData;
};

// ASCII Art Pattern
export const asciiArt = (imageData) => {
  const width = imageData.width
  const height = imageData.height
  const data = imageData.data
  const output = new ImageData(width, height)
  const outputData = output.data
  
  // Fixed character size that won't change with image scaling
  const baseCharWidth = 8  // Base size for characters
  const baseCharHeight = 16 // Maintain 2:1 aspect ratio
  
  // Calculate how many characters we can fit
  const cols = Math.max(8, Math.floor(width / baseCharWidth))
  const rows = Math.max(4, Math.floor(height / baseCharHeight))
  
  // Actual size of each character block
  const charWidth = Math.floor(width / cols)
  const charHeight = Math.floor(height / rows)
  
  // Ramp from darkest to lightest (more characters for better gradients)
  const asciiChars = '@%#*+=-:. '.split('').reverse()
  
  // Create offscreen canvas for drawing text
  const textCanvas = document.createElement('canvas')
  textCanvas.width = width
  textCanvas.height = height
  const textCtx = textCanvas.getContext('2d', { alpha: false })
  
  // Set up text rendering
  textCtx.fillStyle = 'black'
  textCtx.fillRect(0, 0, width, height)
  textCtx.fillStyle = 'white'
  textCtx.font = `bold ${charHeight}px monospace`
  textCtx.textBaseline = 'middle'
  textCtx.textAlign = 'center'
  
  // Process blocks of pixels
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * charWidth
      const y = row * charHeight
      
      // Calculate average brightness for this block
      let totalBrightness = 0
      let samples = 0
      
      for (let blockY = 0; blockY < charHeight && y + blockY < height; blockY++) {
        for (let blockX = 0; blockX < charWidth && x + blockX < width; blockX++) {
          const i = ((y + blockY) * width + (x + blockX)) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          totalBrightness += 0.299 * r + 0.587 * g + 0.114 * b
          samples++
        }
      }
      
      const avgBrightness = totalBrightness / samples
      const charIndex = Math.floor((avgBrightness / 255) * (asciiChars.length - 1))
      const char = asciiChars[charIndex]
      
      // Draw the character centered in its block
      textCtx.fillText(char, x + charWidth/2, y + charHeight/2)
    }
  }
  
  // Copy the text canvas back to output
  const finalData = textCtx.getImageData(0, 0, width, height)
  for (let i = 0; i < finalData.data.length; i++) {
    outputData[i] = finalData.data[i]
  }
  
  return output
}

// Grain effect - adds film-like noise texture
export const grain = (imageData, intensity = 0.1) => {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Generate random noise for each channel
    const noise = (Math.random() - 0.5) * 2 * intensity * 255;
    
    // Apply noise to RGB channels
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // Red
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // Green
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // Blue
    // Alpha channel remains unchanged
  }
  
  return imageData;
};

// Halftone using circular dots per cell
export const halftoneCircles = (imageData, cellSize = 8) => {
  const width = imageData.width
  const height = imageData.height
  const src = imageData.data
  const out = new ImageData(width, height)
  const outData = out.data

  // Initialize to white background
  for (let i = 0; i < outData.length; i += 4) {
    outData[i] = 255
    outData[i + 1] = 255
    outData[i + 2] = 255
    outData[i + 3] = 255
  }

  for (let y0 = 0; y0 < height; y0 += cellSize) {
    for (let x0 = 0; x0 < width; x0 += cellSize) {
      const tileW = Math.min(cellSize, width - x0)
      const tileH = Math.min(cellSize, height - y0)

      // Average luminance in this cell
      let sum = 0
      let count = 0
      for (let ty = 0; ty < tileH; ty++) {
        for (let tx = 0; tx < tileW; tx++) {
          const x = x0 + tx
          const y = y0 + ty
          const i = (y * width + x) * 4
          sum += 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2]
          count++
        }
      }
      const avg = sum / count

      const cx = x0 + tileW / 2
      const cy = y0 + tileH / 2
      const maxR = Math.min(tileW, tileH) / 2 - 0.1
      const radius = (1 - avg / 255) * maxR
      const r2 = radius * radius

      for (let ty = 0; ty < tileH; ty++) {
        for (let tx = 0; tx < tileW; tx++) {
          const x = x0 + tx
          const y = y0 + ty
          const dx = (x + 0.5) - cx
          const dy = (y + 0.5) - cy
          const i = (y * width + x) * 4
          if (dx * dx + dy * dy <= r2) {
            outData[i] = outData[i + 1] = outData[i + 2] = 0
          }
        }
      }
    }
  }

  return out
}

// Glitch effects
export const dataMosh = (imageData, options = {}) => {
  const { intensity = 0.1, time = 0 } = options;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new ImageData(new Uint8ClampedArray(src), width, height);

  // Time-based glitch patterns
  const glitchSeed = Math.sin(time * 0.001) * 1000;
  
  // Random horizontal line shifts
  for (let y = 0; y < height; y++) {
    if (Math.random() < intensity) {
      const shift = Math.floor((Math.random() - 0.5) * 50 * (1 + Math.sin(glitchSeed + y * 0.1)));
      const rowStart = y * width * 4;
      
      for (let x = 0; x < width; x++) {
        const sourceX = Math.max(0, Math.min(width - 1, x + shift));
        const sourceIdx = y * width * 4 + sourceX * 4;
        const targetIdx = rowStart + x * 4;
        
        out.data[targetIdx] = src[sourceIdx];
        out.data[targetIdx + 1] = src[sourceIdx + 1];
        out.data[targetIdx + 2] = src[sourceIdx + 2];
      }
    }
  }

  return out;
};

export const pixelSort = (imageData, options = {}) => {
  const { threshold = 128, direction = 'horizontal' } = options;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new ImageData(new Uint8ClampedArray(src), width, height);

  if (direction === 'horizontal') {
    for (let y = 0; y < height; y++) {
      const pixels = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const brightness = (src[idx] + src[idx + 1] + src[idx + 2]) / 3;
        if (brightness > threshold) {
          pixels.push([src[idx], src[idx + 1], src[idx + 2], src[idx + 3]]);
        } else {
          // Write sorted pixels and reset
          pixels.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]));
          let pixelIdx = 0;
          for (let sx = 0; sx <= x; sx++) {
            const sidx = (y * width + sx) * 4;
            if (pixelIdx < pixels.length) {
              out.data[sidx] = pixels[pixelIdx][0];
              out.data[sidx + 1] = pixels[pixelIdx][1];
              out.data[sidx + 2] = pixels[pixelIdx][2];
              out.data[sidx + 3] = pixels[pixelIdx][3];
              pixelIdx++;
            } else {
              out.data[sidx] = src[sidx];
              out.data[sidx + 1] = src[sidx + 1];
              out.data[sidx + 2] = src[sidx + 2];
              out.data[sidx + 3] = src[sidx + 3];
            }
          }
          pixels.length = 0;
        }
      }
    }
  }

  return out;
};

export const chromaticAberration = (imageData, options = {}) => {
  const { intensity = 5, time = 0 } = options;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new ImageData(width, height);
  const outData = out.data;

  // Animated offset
  const animatedOffset = intensity * (1 + Math.sin(time * 0.002) * 0.5);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      // Red channel shift
      const redX = Math.max(0, Math.min(width - 1, x - animatedOffset));
      const redIdx = (y * width + Math.floor(redX)) * 4;
      outData[idx] = src[redIdx];
      
      // Green channel (no shift)
      outData[idx + 1] = src[idx + 1];
      
      // Blue channel shift
      const blueX = Math.max(0, Math.min(width - 1, x + animatedOffset));
      const blueIdx = (y * width + Math.floor(blueX)) * 4;
      outData[idx + 2] = src[blueIdx];
      
      outData[idx + 3] = src[idx + 3];
    }
  }

  return out;
};

export const digitalCorruption = (imageData, options = {}) => {
  const { intensity = 0.05, time = 0 } = options;
  const width = imageData.width;
  const height = imageData.height;
  const src = imageData.data;
  const out = new ImageData(new Uint8ClampedArray(src), width, height);

  // Time-based corruption patterns
  const corruptionSeed = Math.cos(time * 0.0007) * 1000;

  // Random block corruption
  for (let block = 0; block < intensity * 20; block++) {
    const blockSize = Math.floor(Math.random() * 20) + 5;
    const blockX = Math.floor(Math.random() * width);
    const blockY = Math.floor(Math.random() * height);
    
    for (let y = blockY; y < Math.min(blockY + blockSize, height); y++) {
      for (let x = blockX; x < Math.min(blockX + blockSize, width); x++) {
        const idx = (y * width + x) * 4;
        
        // Random color corruption
        if (Math.random() < 0.1) {
          out.data[idx] = Math.random() * 255;
          out.data[idx + 1] = Math.random() * 255;
          out.data[idx + 2] = Math.random() * 255;
        } else {
          // Channel swapping
          const offset = Math.floor(Math.sin(corruptionSeed + x * 0.1 + y * 0.1) * 3);
          out.data[idx] = src[idx + ((offset % 3) + 3) % 3];
          out.data[idx + 1] = src[idx + ((offset + 1) % 3) + 3];
          out.data[idx + 2] = src[idx + ((offset + 2) % 3) + 3];
        }
        out.data[idx + 3] = src[idx + 3];
      }
    }
  }

  return out;
};
