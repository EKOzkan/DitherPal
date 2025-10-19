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

// Bayer Ordered (8x8)
export const bayerOrdered = (imageData) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const matrix = [
    [0, 48, 12, 60, 3, 51, 15, 63],
    [32, 16, 44, 28, 35, 19, 47, 31],
    [8, 56, 4, 52, 11, 59, 7, 55],
    [40, 24, 36, 20, 43, 27, 39, 23],
    [2, 50, 14, 62, 1, 49, 13, 61],
    [34, 18, 46, 30, 33, 17, 45, 29],
    [10, 58, 6, 54, 9, 57, 5, 53],
    [42, 26, 38, 22, 41, 25, 37, 21]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Calculate luminance using proper weights
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      
      // Only apply dithering if the pixel isn't close to black
      if (luminance > 10) {
        const threshold = (matrix[y % 8][x % 8] / 64) * 255;
        const value = luminance < threshold ? 0 : 255;
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
      } else {
        // Keep very dark pixels black
        data[idx] = data[idx + 1] = data[idx + 2] = 0;
      }
    }
  }
  return imageData;
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