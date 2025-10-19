import { useState, useEffect } from 'react'
import './App.css'
import { Rnd } from 'react-rnd'
import {
  floydSteinberg,
  jarvisJudiceNinke,
  atkinson,
  stucki,
  burkes,
  sierra,
  bayerOrdered,
  randomOrdered,
  bitTone,
  crossPlus,
  asciiArt
} from './operations/algorithms'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

function App() {
  const [originalImage, setOriginalImage] = useState(null)
  const [editedImage, setEditedImage] = useState(null)
  const [size, SetSize] = useState(10)
  const [contrast, setContrast] = useState(128)
  const [midtones, setMidtones] = useState(128)
  const [highlights, setHighlights] = useState(128)
  const [threshold, setThreshold] = useState(128)
  const [luminanceThresholdEnabled, setLuminanceThresholdEnabled] = useState(false)
  const [algorithm, setAlgorithm] = useState("floydSteinberg")
  const [bloom, setBloom] = useState(0)
  const [colorMode, setColorMode] = useState("rgb")
  const [redValue, setRedValue] = useState(255)
  const [greenValue, setGreenValue] = useState(255)
  const [blueValue, setBlueValue] = useState(255)
  const [singleColor, setSingleColor] = useState("#ffffff")
  const [crtEnabled, setCrtEnabled] = useState(false)

  const handleExport = () => {
    if (editedImage) {
      const link = document.createElement('a')
      link.download = 'dithered_image.png'
      link.href = editedImage
      link.click()
    }
  }

  useEffect(() => {
    if (originalImage) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const image = new Image()
      image.onload = () => {
        const scale = size / 100
        const minSize = 200
        canvas.width = Math.max(Math.round(image.width * scale), minSize)
        canvas.height = Math.max(Math.round(image.height * scale), minSize)
        ctx.imageSmoothingEnabled = false  // Disable smoothing for initial canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        // Create a copy of the image data
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Create a fresh copy for adjustments
        const workingImageData = new ImageData(
          new Uint8ClampedArray(originalImageData.data),
          originalImageData.width,
          originalImageData.height
        )

        // Apply selected dithering algorithm
        let ditheredData
        const processedData = new ImageData(
          new Uint8ClampedArray(workingImageData.data),
          workingImageData.width,
          workingImageData.height
        )

        // Apply adjustments in order for maximum crispness
        applyContrast(processedData, contrast)
        applyMidtones(processedData, midtones)
        applyHighlights(processedData, highlights)
        
        // Apply threshold before dithering if enabled
        if (luminanceThresholdEnabled) {
          applyLuminanceThreshold(processedData, threshold)
        }

        switch(algorithm) {
          case "none":
            ditheredData = processedData
            break
          case "floydSteinberg":
            ditheredData = floydSteinberg(processedData)
            break
          case "jarvisJudiceNinke":
            ditheredData = jarvisJudiceNinke(processedData)
            break
          case "atkinson":
            ditheredData = atkinson(processedData)
            break
          case "stucki":
            ditheredData = stucki(processedData)
            break
          case "burkes":
            ditheredData = burkes(processedData)
            break
          case "sierra":
            ditheredData = sierra(processedData)
            break
          case "bayerOrdered":
            ditheredData = bayerOrdered(processedData)
            break
          case "randomOrdered":
            ditheredData = randomOrdered(processedData)
            break
          case "bitTone":
            ditheredData = bitTone(processedData)
            break
          case "crossPlus":
            ditheredData = crossPlus(processedData)
            break
          case "asciiArt":
            ditheredData = asciiArt(processedData)
            break
          default:
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

          if (colorMode === "rgb") {
            coloredData.data[i] = (brightness / 255) * redValue
            coloredData.data[i + 1] = (brightness / 255) * greenValue
            coloredData.data[i + 2] = (brightness / 255) * blueValue
          } else {
            // Parse the hex color into RGB components
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
        if (bloom > 0) {
          ditheredData = applyBloom(ditheredData, bloom)
        }

        // Scale back up and display
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = Math.max(Math.round(image.width), minSize)
        finalCanvas.height = Math.max(Math.round(image.height), minSize)
        const finalCtx = finalCanvas.getContext('2d', { alpha: false })
        finalCtx.imageSmoothingEnabled = false  // Disable smoothing for final canvas
        
        // Put the dithered data on the original canvas
        ctx.putImageData(ditheredData, 0, 0)
        
        // Clear the final canvas before drawing
        finalCtx.fillStyle = 'black'
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)
        
        // Draw the dithered image onto the final canvas with integer coordinates
        finalCtx.drawImage(
          canvas, 
          0, 0, canvas.width, canvas.height,
          0, 0, finalCanvas.width, finalCanvas.height
        )

        // Apply CRT overlay if enabled
        if (crtEnabled) {
          applyCRTEffect(finalCtx, finalCanvas.width, finalCanvas.height)
        }
        
        // Convert to data URL and update state
        setEditedImage(finalCanvas.toDataURL())
      }
      image.src = originalImage
    }
    console.log("effect applied with algorithm:", algorithm)
  }, [originalImage, size, contrast, midtones, highlights, threshold, luminanceThresholdEnabled, algorithm, bloom, colorMode, redValue, greenValue, blueValue, singleColor, crtEnabled])

  function applyContrast(imageData, contrastValue) {
    const data = imageData.data
    const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue))
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = clamp(factor * (data[i]   - 128) + 128)
      data[i+1] = clamp(factor * (data[i+1] - 128) + 128)
      data[i+2] = clamp(factor * (data[i+2] - 128) + 128)
    }
  }

  function applyMidtones(imageData, midtoneValue) {
    const data = imageData.data
    const gamma = midtoneValue / 128
    for (let i = 0; i < data.length; i += 4) {
      data[i]   = clamp(255 * Math.pow(data[i]   / 255, 1 / gamma))
      data[i+1] = clamp(255 * Math.pow(data[i+1] / 255, 1 / gamma))
      data[i+2] = clamp(255 * Math.pow(data[i+2] / 255, 1 / gamma))
    }
  }

  function applyHighlights(imageData, highlightValue) {
    const data = imageData.data
    const factor = highlightValue / 128
    for (let i = 0; i < data.length; i += 4) {
      if (data[i]   > 128) data[i]   = clamp(data[i]   * factor)
      if (data[i+1] > 128) data[i+1] = clamp(data[i+1] * factor)
      if (data[i+2] > 128) data[i+2] = clamp(data[i+2] * factor)
    }
  }

  function applyLuminanceThreshold(imageData, thresholdValue) {
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

  function clamp(value) {
    return Math.max(0, Math.min(255, value))
  }

  function applyBloom(imageData, intensity) {
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
        workingData[i] = clamp(workingData[i] * 1.2)
        workingData[i + 1] = clamp(workingData[i + 1] * 1.2)
        workingData[i + 2] = clamp(workingData[i + 2] * 1.2)
      }
    }

    // Blend with original using screen blend mode for better glow
    const bloomStrength = intensity / 100
    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        const a = data[i + j] / 255
        const b = (workingData[i + j] * bloomStrength) / 255
        resultData[i + j] = clamp((1 - (1 - a) * (1 - b)) * 255)
      }
      resultData[i + 3] = 255
    }

    return result
  }

  function applyCRTEffect(ctx, width, height) {
    ctx.save()

    // Horizontal scanlines
    ctx.globalAlpha = 0.12
    ctx.fillStyle = '#000000'
    for (let y = 0; y < height; y += 2) {
      ctx.fillRect(0, y, width, 1)
    }

    // Subtle vertical aperture grille
    ctx.globalAlpha = 0.05
    for (let x = 0; x < width; x += 3) {
      ctx.fillRect(x, 0, 1, height)
    }

    // Vignette to darken edges
    const maxDim = Math.max(width, height)
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, maxDim / 1.1
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, 'rgba(0,0,0,0.28)')
    ctx.globalAlpha = 1
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.restore()
  }

  return (
    <div className="main-container">
      <Rnd
        style={{ 
          zIndex: 1000, 
          backgroundColor: "black", 
          border: '2px solid',
          borderTopColor: '#808080',
          borderLeftColor: '#808080',
          borderBottomColor: '#ffffff',
          borderRightColor: '#ffffff'
        }}
        default={{
          x: 0,
          y: 0,
          width: 240,
          height: 20,
        }}
        dragHandleClassName="drag-handle"
        enableResizing={{
          top: false,
          right: false,
          bottom: false,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
      >
        <div className="drag-handle">
          Settings
        </div>
        <div className="settings-container">
          <div className="file-input-container">
            <input
              type="file"
              id="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0]
                const reader = new FileReader()
                reader.onloadend = () => {
                  setOriginalImage(reader.result)
                }
                reader.readAsDataURL(file)
              }}
            />
            <label htmlFor="file" className="file-input-label">
              Choose Image
            </label>
          </div>
          <div>{'>'} Size_</div>
          <input
            type="range"
            min="1"
            max="100"
            value={size}
            onChange={(e) => {
              SetSize(parseInt(e.target.value, 10))
            }}
          />
          <div>{'>'} Contrast_</div>
          <input
            type="range"
            min="0"
            max="255"
            value={contrast}
            onChange={(e) => {
              setContrast(parseInt(e.target.value, 10))
            }}
          />
          <div>{'>'} Midtones_</div>
          <input
            type="range"
            min="1"
            max="255"
            value={midtones}
            onChange={(e) => {
              setMidtones(parseInt(e.target.value, 10))
            }}
          />
          <div>{'>'} Highlights_</div>
          <input
            type="range"
            min="1"
            max="255"
            value={highlights}
            onChange={(e) => {
              setHighlights(parseInt(e.target.value, 10))
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={luminanceThresholdEnabled}
              onChange={(e) => setLuminanceThresholdEnabled(e.target.checked)}
              style={{
                width: '15px',
                height: '15px',
                cursor: 'pointer',
                accentColor: 'black'
              }}
            />
            <div style={{ margin: 0 }}>{'>'} Luminance_Threshold_</div>
          </div>
          <input
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={(e) => {
              setThreshold(parseInt(e.target.value, 10))
            }}
            style={{ opacity: luminanceThresholdEnabled ? 1 : 0.5 }}
          />
          <div>{'>'} Dithering_Algorithm_</div>
          <select
            value={algorithm}
            onChange={(e) => {
              console.log("Selected algorithm:", e.target.value)
              setAlgorithm(e.target.value)
            }}
          >
            <option value="none">None</option>
            <option value="floydSteinberg">Floyd-Steinberg</option>
            <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke</option>
            <option value="atkinson">Atkinson</option>
            <option value="stucki">Stucki</option>
            <option value="burkes">Burkes</option>
            <option value="sierra">Sierra</option>
            <option value="bayerOrdered">Bayer Ordered</option>
            <option value="randomOrdered">Random Ordered</option>
            <option value="bitTone">Bit Tone</option>
            <option value="crossPlus">Cross Plus</option>
            <option value="asciiArt">ASCII Art</option>
          </select>
          <div>{'>'} Bloom_</div>
          <input
            type="range"
            min="0"
            max="200"
            value={bloom}
            onChange={(e) => {
              setBloom(parseInt(e.target.value, 10))
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={crtEnabled}
              onChange={(e) => setCrtEnabled(e.target.checked)}
              style={{
                width: '15px',
                height: '15px',
                cursor: 'pointer',
                accentColor: 'black'
              }}
            />
            <div style={{ margin: 0 }}>{'>'} CRT_Effect_</div>
          </div>
          <div>{'>'} Color_Mode_</div>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
          >
            <option value="rgb">RGB Mode</option>
            <option value="single">Single Color Mode</option>
          </select>

          {colorMode === "rgb" ? (
            <>
              <div>{'>'} Red_</div>
              <input
                type="range"
                min="0"
                max="255"
                value={redValue}
                onChange={(e) => setRedValue(parseInt(e.target.value, 10))}
              />
              <div>{'>'} Green_</div>
              <input
                type="range"
                min="0"
                max="255"
                value={greenValue}
                onChange={(e) => setGreenValue(parseInt(e.target.value, 10))}
              />
              <div>{'>'} Blue_</div>
              <input
                type="range"
                min="0"
                max="255"
                value={blueValue}
                onChange={(e) => setBlueValue(parseInt(e.target.value, 10))}
              />
            </>
          ) : (
            <>
              <div>{'>'} Color_</div>
              <input
                type="color"
                value={singleColor}
                onChange={(e) => setSingleColor(e.target.value)}
                style={{ width: "100%" }}
              />
            </>
          )}
          <div className="file-input-container">
            <button 
              onClick={handleExport}
              disabled={!editedImage}
              style={{
                width: '100%',
                background: '#000000',
                border: '2px solid',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderBottomColor: '#808080',
                borderRightColor: '#808080',
                color: 'white',
                padding: '4px',
                fontSize: '0.6rem',
                cursor: editedImage ? 'pointer' : 'not-allowed',
                opacity: editedImage ? 1 : 0.5,
                marginTop: '10px'
              }}
            >
              Export Image
            </button>
          </div>
        </div>
      </Rnd>
      <div style={{
        height:"100vh", 
        width:'100vw', 
        backgroundColor:"black", 
        position: "fixed", 
        top: 0, 
        left: 0, 
        zIndex: 0, 

        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {editedImage &&
          <TransformWrapper
            minScale={0.1}
            maxScale={7}
            centerOnInit={true}
            limitToBounds={false}
            initialScale={1}
          >
            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                minWidth: "200px",
                minHeight: "200px"
              }}
            >
              <img 
                src={editedImage} 
                style={{
                  minWidth: "100px",
                  minHeight: "100px",
                  objectFit: "contain",
                  border: '2px dotted',
                  imageRendering: 'pixelated',  // Add crisp rendering for browsers
                  WebkitImageRendering: 'pixelated',
                  msImageRendering: 'pixelated',
                }} 
                alt="Edited" 
              />
            </TransformComponent>
          </TransformWrapper>
        }
      </div>
    </div>
  )
}

export default App
