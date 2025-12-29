import { useState, useEffect, useRef } from 'react'
import './App.css'
import { Rnd } from 'react-rnd'
import {
  floydSteinberg,
  floydSteinbergSerpentine,
  falseFloydSteinberg,
  jarvisJudiceNinke,
  atkinson,
  stucki,
  burkes,
  sierra,
  twoRowSierra,
  sierraLite,
  bayerOrdered,
  bayerOrdered4x4,
  bayerOrdered16x16,
  randomOrdered,
  bitTone,
  crossPlus,
  asciiArt,
  halftoneCircles,
  grain
} from './operations/algorithms'
import { PRESET_PALETTES, hexToRgb } from './operations/palettes'
import { applyPaletteMapping } from './operations/rgbProcessing'
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { VideoProcessor } from './operations/videoProcessor'
import { ImageToVideoProcessor } from './operations/imageToVideoProcessor'
import { TextOverlay, TEXT_ANIMATION_TYPES, FONT_FAMILIES } from './operations/textOverlay'
import { generateMask, removeBackground, clearMaskCache } from './operations/backgroundRemoval'

function App() {
  const [originalImage, setOriginalImage] = useState(null)
  const [editedImage, setEditedImage] = useState(null)
  const [mediaType, setMediaType] = useState('image') // 'image' or 'video'
  const [videoProcessor, setVideoProcessor] = useState(null)
  const [processedFrames, setProcessedFrames] = useState([])
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [frameRate, setFrameRate] = useState(30)
  const [glitchEnabled, setGlitchEnabled] = useState(false)
  const [glitchIntensity, setGlitchIntensity] = useState(0.1)
  const [selectedGlitchEffect, setSelectedGlitchEffect] = useState('dataMosh')
  const videoProcessorRef = useRef(null)
  const imageToVideoProcessorRef = useRef(null)
  const [videoSource, setVideoSource] = useState('upload')
  const [isGeneratingImageVideo, setIsGeneratingImageVideo] = useState(false)
  const [imageAnimationDuration, setImageAnimationDuration] = useState(3)
  const [imageAnimationFrameRate, setImageAnimationFrameRate] = useState(30)
  const [imageAnimationType, setImageAnimationType] = useState('threshold-wave')
  const [imageAnimationCycles, setImageAnimationCycles] = useState(1)
  const [imageAnimationIntensity, setImageAnimationIntensity] = useState(0.5)
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
  const [rgbModeEnabled, setRgbModeEnabled] = useState(false)
  const [selectedPalette, setSelectedPalette] = useState('commodore64')
  const [customPaletteColors, setCustomPaletteColors] = useState(['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff'])
  const [textOverlayEnabled, setTextOverlayEnabled] = useState(false)
  const [textContent, setTextContent] = useState('YOUR TEXT HERE')
  const [textFontFamily, setTextFontFamily] = useState('Impact')
  const [textFontSize, setTextFontSize] = useState(72)
  const [textColor, setTextColor] = useState('#ffffff')
  const [textStrokeColor, setTextStrokeColor] = useState('#000000')
  const [textStrokeWidth, setTextStrokeWidth] = useState(4)
  const [textPositionX, setTextPositionX] = useState(50)
  const [textPositionY, setTextPositionY] = useState(50)
  const [textPositionType, setTextPositionType] = useState('percent')
  const [textAlignment, setTextAlignment] = useState('center')
  const [textAnimationType, setTextAnimationType] = useState('none')
  const [textAnimationDuration, setTextAnimationDuration] = useState(1)
  const [textStartTime, setTextStartTime] = useState(0)
  const [textEndTime, setTextEndTime] = useState(10)
  const [textShadow, setTextShadow] = useState(true)
  const [backgroundRemovalEnabled, setBackgroundRemovalEnabled] = useState(false)
  const [maskSensitivity, setMaskSensitivity] = useState(128)
  const [featherEdgesEnabled, setFeatherEdgesEnabled] = useState(false)
  const [featherAmount, setFeatherAmount] = useState(5)
  const [hue, setHue] = useState(0)
  const [vibrance, setVibrance] = useState(0)
  const [saturation, setSaturation] = useState(100)
  const [manualRenderEnabled, setManualRenderEnabled] = useState(false)
  const [renderTrigger, setRenderTrigger] = useState(0)

  const handleExport = () => {
    if (editedImage) {
      const link = document.createElement('a')
      link.download = 'dithered_image.png'
      link.href = editedImage
      link.click()
    }
  }

  const handleSaveSettings = () => {
    const settings = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      imageSettings: {
        size,
        contrast,
        midtones,
        highlights,
        threshold,
        luminanceThresholdEnabled,
        algorithm,
        bloom,
        colorMode,
        redValue,
        greenValue,
        blueValue,
        singleColor,
        crtEnabled,
        rgbModeEnabled,
        selectedPalette,
        customPaletteColors,
        hue,
        vibrance,
        saturation,
        manualRenderEnabled
      },
      videoSettings: {
        frameRate,
        glitchEnabled,
        glitchIntensity,
        selectedGlitchEffect,
        imageAnimationDuration,
        imageAnimationFrameRate,
        imageAnimationType,
        imageAnimationCycles,
        imageAnimationIntensity
      },
      textOverlaySettings: {
        textOverlayEnabled,
        textContent,
        textFontFamily,
        textFontSize,
        textColor,
        textStrokeColor,
        textStrokeWidth,
        textPositionX,
        textPositionY,
        textPositionType,
        textAlignment,
        textAnimationType,
        textAnimationDuration,
        textStartTime,
        textEndTime,
        textShadow
      }
    }

    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dither-settings.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleLoadSettings = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result)
        
        if (!settings.version) {
          alert('Invalid settings file format.')
          return
        }

        if (settings.imageSettings) {
          const img = settings.imageSettings
          if (img.size !== undefined) SetSize(img.size)
          if (img.contrast !== undefined) setContrast(img.contrast)
          if (img.midtones !== undefined) setMidtones(img.midtones)
          if (img.highlights !== undefined) setHighlights(img.highlights)
          if (img.threshold !== undefined) setThreshold(img.threshold)
          if (img.luminanceThresholdEnabled !== undefined) setLuminanceThresholdEnabled(img.luminanceThresholdEnabled)
          if (img.algorithm !== undefined) setAlgorithm(img.algorithm)
          if (img.bloom !== undefined) setBloom(img.bloom)
          if (img.colorMode !== undefined) setColorMode(img.colorMode)
          if (img.redValue !== undefined) setRedValue(img.redValue)
          if (img.greenValue !== undefined) setGreenValue(img.greenValue)
          if (img.blueValue !== undefined) setBlueValue(img.blueValue)
          if (img.singleColor !== undefined) setSingleColor(img.singleColor)
          if (img.crtEnabled !== undefined) setCrtEnabled(img.crtEnabled)
          if (img.rgbModeEnabled !== undefined) setRgbModeEnabled(img.rgbModeEnabled)
          if (img.selectedPalette !== undefined) setSelectedPalette(img.selectedPalette)
          if (img.customPaletteColors !== undefined) setCustomPaletteColors(img.customPaletteColors)
          if (img.hue !== undefined) setHue(img.hue)
          if (img.vibrance !== undefined) setVibrance(img.vibrance)
          if (img.saturation !== undefined) setSaturation(img.saturation)
          if (img.manualRenderEnabled !== undefined) setManualRenderEnabled(img.manualRenderEnabled)
        }

        if (settings.videoSettings) {
          const vid = settings.videoSettings
          if (vid.frameRate !== undefined) setFrameRate(vid.frameRate)
          if (vid.glitchEnabled !== undefined) setGlitchEnabled(vid.glitchEnabled)
          if (vid.glitchIntensity !== undefined) setGlitchIntensity(vid.glitchIntensity)
          if (vid.selectedGlitchEffect !== undefined) setSelectedGlitchEffect(vid.selectedGlitchEffect)
          if (vid.imageAnimationDuration !== undefined) setImageAnimationDuration(vid.imageAnimationDuration)
          if (vid.imageAnimationFrameRate !== undefined) setImageAnimationFrameRate(vid.imageAnimationFrameRate)
          if (vid.imageAnimationType !== undefined) setImageAnimationType(vid.imageAnimationType)
          if (vid.imageAnimationCycles !== undefined) setImageAnimationCycles(vid.imageAnimationCycles)
          if (vid.imageAnimationIntensity !== undefined) setImageAnimationIntensity(vid.imageAnimationIntensity)
        }

        if (settings.textOverlaySettings) {
          const txt = settings.textOverlaySettings
          if (txt.textOverlayEnabled !== undefined) setTextOverlayEnabled(txt.textOverlayEnabled)
          if (txt.textContent !== undefined) setTextContent(txt.textContent)
          if (txt.textFontFamily !== undefined) setTextFontFamily(txt.textFontFamily)
          if (txt.textFontSize !== undefined) setTextFontSize(txt.textFontSize)
          if (txt.textColor !== undefined) setTextColor(txt.textColor)
          if (txt.textStrokeColor !== undefined) setTextStrokeColor(txt.textStrokeColor)
          if (txt.textStrokeWidth !== undefined) setTextStrokeWidth(txt.textStrokeWidth)
          if (txt.textPositionX !== undefined) setTextPositionX(txt.textPositionX)
          if (txt.textPositionY !== undefined) setTextPositionY(txt.textPositionY)
          if (txt.textPositionType !== undefined) setTextPositionType(txt.textPositionType)
          if (txt.textAlignment !== undefined) setTextAlignment(txt.textAlignment)
          if (txt.textAnimationType !== undefined) setTextAnimationType(txt.textAnimationType)
          if (txt.textAnimationDuration !== undefined) setTextAnimationDuration(txt.textAnimationDuration)
          if (txt.textStartTime !== undefined) setTextStartTime(txt.textStartTime)
          if (txt.textEndTime !== undefined) setTextEndTime(txt.textEndTime)
          if (txt.textShadow !== undefined) setTextShadow(txt.textShadow)
        }

        alert('Settings loaded successfully!')
      } catch (error) {
        console.error('Error loading settings:', error)
        alert('Error loading settings file. Please check the file format.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleVideoUpload = async (file) => {
    try {
      const processor = new VideoProcessor()
      videoProcessorRef.current = processor
      await processor.loadVideo(file)
      setVideoProcessor(processor)
      setVideoSource('upload')
      setMediaType('video')
      setOriginalImage(null)
      setEditedImage(null)
    } catch (error) {
      console.error('Error loading video:', error)
      alert('Error loading video file. Please try a different file.')
    }
  }

  const configureTextOverlay = () => {
    if (!textOverlayEnabled) {
      return null
    }
    
    const overlay = new TextOverlay()
    overlay.addTextLayer({
      text: textContent,
      fontFamily: textFontFamily,
      fontSize: textFontSize,
      color: textColor,
      strokeColor: textStrokeColor,
      strokeWidth: textStrokeWidth,
      position: { x: textPositionX, y: textPositionY },
      positionType: textPositionType,
      alignment: textAlignment,
      animationType: textAnimationType,
      animationDuration: textAnimationDuration,
      startTime: textStartTime,
      endTime: textEndTime,
      shadow: textShadow
    })
    
    return overlay
  }

  const generateAnimatedVideoFromImage = async () => {
    if (!originalImage || isGeneratingImageVideo) return
    
    setIsGeneratingImageVideo(true)
    
    try {
      const processor = new ImageToVideoProcessor()
      imageToVideoProcessorRef.current = processor
      
      await processor.loadImage(originalImage)
      
      const textOverlay = configureTextOverlay()
      if (textOverlay) {
        processor.setTextOverlay(textOverlay)
      }
      
      // Get the algorithm function based on selection
      let algorithmFunction
      switch(algorithm) {
        case "none":
          algorithmFunction = (data) => data
          break
        case "floydSteinberg":
          algorithmFunction = floydSteinberg
          break
        case "floydSteinbergSerpentine":
          algorithmFunction = floydSteinbergSerpentine
          break
        case "falseFloydSteinberg":
          algorithmFunction = falseFloydSteinberg
          break
        case "jarvisJudiceNinke":
          algorithmFunction = jarvisJudiceNinke
          break
        case "atkinson":
          algorithmFunction = atkinson
          break
        case "stucki":
          algorithmFunction = stucki
          break
        case "burkes":
          algorithmFunction = burkes
          break
        case "sierra":
          algorithmFunction = sierra
          break
        case "twoRowSierra":
          algorithmFunction = twoRowSierra
          break
        case "sierraLite":
          algorithmFunction = sierraLite
          break
        case "bayerOrdered":
          algorithmFunction = bayerOrdered
          break
        case "bayerOrdered4x4":
          algorithmFunction = bayerOrdered4x4
          break
        case "bayerOrdered16x16":
          algorithmFunction = bayerOrdered16x16
          break
        case "randomOrdered":
          algorithmFunction = randomOrdered
          break
        case "bitTone":
          algorithmFunction = bitTone
          break
        case "crossPlus":
          algorithmFunction = crossPlus
          break
        case "asciiArt":
          algorithmFunction = asciiArt
          break
        case "halftoneCircles":
          algorithmFunction = halftoneCircles
          break
        case "grain":
          algorithmFunction = grain
          break
        default:
          algorithmFunction = (data) => data
      }

      // Generate animated frames with parameter animation
      const processed = await processor.generateAnimatedFrames(algorithmFunction, {
        size,
        contrast,
        midtones,
        highlights,
        threshold,
        luminanceThresholdEnabled,
        bloom,
        colorMode,
        redValue,
        greenValue,
        blueValue,
        singleColor,
        crtEnabled,
        glitchEnabled,
        glitchIntensity,
        selectedGlitchEffect,
        rgbModeEnabled,
        selectedPalette,
        customPaletteColors,
        hue,
        vibrance,
        saturation,
        backgroundRemovalEnabled,
        maskSensitivity,
        featherEdgesEnabled,
        featherAmount
      }, {
        duration: imageAnimationDuration,
        frameRate: imageAnimationFrameRate,
        animationType: imageAnimationType,
        animationParams: {
          cycles: imageAnimationCycles,
          intensity: imageAnimationIntensity,
          maxBloom: 150
        }
      })

      setProcessedFrames(processed)
      setVideoProcessor(processor)
      setFrameRate(imageAnimationFrameRate)
      videoProcessorRef.current = processor
      setVideoSource('image')
      setMediaType('video')
      
      // Show first frame
      if (processed.length > 0) {
        const firstFramePreview = processor.getFramePreview(0)
        setEditedImage(firstFramePreview)
        setCurrentFrame(0)
      }
      
    } catch (error) {
      console.error('Error generating animated video:', error)
      alert('Error generating animated video. Please try again.')
      setVideoSource('upload')
      setMediaType('image')
    } finally {
      setIsGeneratingImageVideo(false)
    }
  }

  const processVideo = async () => {
    if (!videoProcessor || isProcessingVideo || videoSource === 'image') return
    
    setIsProcessingVideo(true)
    
    try {
      const textOverlay = configureTextOverlay()
      if (textOverlay) {
        videoProcessor.setTextOverlay(textOverlay)
      }
      
      // Extract frames from video
      await videoProcessor.extractFrames(frameRate)
      
      // Get the algorithm function based on selection
      let algorithmFunction
      switch(algorithm) {
        case "none":
          algorithmFunction = (data) => data
          break
        case "floydSteinberg":
          algorithmFunction = floydSteinberg
          break
        case "floydSteinbergSerpentine":
          algorithmFunction = floydSteinbergSerpentine
          break
        case "falseFloydSteinberg":
          algorithmFunction = falseFloydSteinberg
          break
        case "jarvisJudiceNinke":
          algorithmFunction = jarvisJudiceNinke
          break
        case "atkinson":
          algorithmFunction = atkinson
          break
        case "stucki":
          algorithmFunction = stucki
          break
        case "burkes":
          algorithmFunction = burkes
          break
        case "sierra":
          algorithmFunction = sierra
          break
        case "twoRowSierra":
          algorithmFunction = twoRowSierra
          break
        case "sierraLite":
          algorithmFunction = sierraLite
          break
        case "bayerOrdered":
          algorithmFunction = bayerOrdered
          break
        case "bayerOrdered4x4":
          algorithmFunction = bayerOrdered4x4
          break
        case "bayerOrdered16x16":
          algorithmFunction = bayerOrdered16x16
          break
        case "randomOrdered":
          algorithmFunction = randomOrdered
          break
        case "bitTone":
          algorithmFunction = bitTone
          break
        case "crossPlus":
          algorithmFunction = crossPlus
          break
        case "asciiArt":
          algorithmFunction = asciiArt
          break
        case "halftoneCircles":
          algorithmFunction = halftoneCircles
          break
        case "grain":
          algorithmFunction = grain
          break
        default:
          algorithmFunction = (data) => data
      }

      // Process frames with dithering and effects
      const processed = await videoProcessor.processFrames(algorithmFunction, {
        glitchEnabled,
        glitchIntensity,
        selectedGlitchEffect,
        size,
        contrast,
        midtones,
        highlights,
        threshold,
        luminanceThresholdEnabled,
        bloom,
        colorMode,
        redValue,
        greenValue,
        blueValue,
        singleColor,
        crtEnabled,
        rgbModeEnabled,
        selectedPalette,
        customPaletteColors,
        hue,
        vibrance,
        saturation,
        backgroundRemovalEnabled,
        maskSensitivity,
        featherEdgesEnabled,
        featherAmount
      })

      setProcessedFrames(processed)
      
      // Show first frame
      if (processed.length > 0) {
        const firstFramePreview = videoProcessor.getFramePreview(0)
        setEditedImage(firstFramePreview)
      }
      
    } catch (error) {
      console.error('Error processing video:', error)
      alert('Error processing video. Please try again.')
    } finally {
      setIsProcessingVideo(false)
    }
  }

  const handleVideoExport = async (format) => {
    if (!videoProcessor || processedFrames.length === 0) return
    
    try {
      let exportUrl
      if (format === 'gif') {
        exportUrl = await videoProcessor.exportAsGIF(frameRate)
      } else if (format === 'mp4') {
        exportUrl = await videoProcessor.exportAsMP4(frameRate)
        format = 'webm' // Update to actual format
      }

      if (exportUrl) {
        const link = document.createElement('a')
        link.download = `dithered_video.${format}`
        link.href = exportUrl
        link.click()
        URL.revokeObjectURL(exportUrl)
      }
    } catch (error) {
      console.error('Error exporting video:', error)
      alert(`Error exporting ${format.toUpperCase()}. Please try again.`)
    }
  }

  const switchToImageMode = () => {
    setMediaType('image')
    if (videoProcessorRef.current) {
      videoProcessorRef.current.cleanup()
      videoProcessorRef.current = null
    }
    if (imageToVideoProcessorRef.current) {
      imageToVideoProcessorRef.current.cleanup()
      imageToVideoProcessorRef.current = null
    }
    setVideoProcessor(null)
    setProcessedFrames([])
    setCurrentFrame(0)
    setVideoSource('upload')
  }

  const customPaletteRenderKey = manualRenderEnabled && rgbModeEnabled && selectedPalette === 'custom'
    ? `manual:${renderTrigger}`
    : `auto:${customPaletteColors.join('|')}:${renderTrigger}`

  useEffect(() => {
    if (originalImage) {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const image = new Image()
      image.onload = async () => {
        const scale = size / 100
        const minSize = 200
        canvas.width = Math.max(Math.round(image.width * scale), minSize)
        canvas.height = Math.max(Math.round(image.height * scale), minSize)
        ctx.imageSmoothingEnabled = false  // Disable smoothing for initial canvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)

        // Create a copy of the image data
        const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // Create a fresh copy for adjustments
        let workingImageData = new ImageData(
          new Uint8ClampedArray(originalImageData.data),
          originalImageData.width,
          originalImageData.height
        )

        // Apply background removal if enabled
        if (backgroundRemovalEnabled) {
          try {
            const mask = await generateMask(workingImageData)
            workingImageData = removeBackground(
              workingImageData, 
              mask, 
              maskSensitivity, 
              featherEdgesEnabled, 
              featherAmount
            )
          } catch (error) {
            console.error('Background removal failed:', error)
            // Continue with original image if background removal fails
          }
        }

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
          case "floydSteinbergSerpentine":
            ditheredData = floydSteinbergSerpentine(processedData)
            break
          case "falseFloydSteinberg":
            ditheredData = falseFloydSteinberg(processedData)
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
          case "twoRowSierra":
            ditheredData = twoRowSierra(processedData)
            break
          case "sierraLite":
            ditheredData = sierraLite(processedData)
            break
          case "bayerOrdered":
            ditheredData = bayerOrdered(processedData)
            break
          case "bayerOrdered4x4":
            ditheredData = bayerOrdered4x4(processedData)
            break
          case "bayerOrdered16x16":
            ditheredData = bayerOrdered16x16(processedData)
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
          case "halftoneCircles":
            ditheredData = halftoneCircles(processedData)
            break
          case "grain":
            ditheredData = grain(processedData)
            break
          default:
            ditheredData = processedData
        }

        // Apply color mode or RGB palette mapping
        let coloredData;
        if (rgbModeEnabled) {
          // RGB mode - map dithered grayscale to selected palette
          const palette = selectedPalette === 'custom'
            ? customPaletteColors.map(hexToRgb)
            : PRESET_PALETTES[selectedPalette].colors;

          coloredData = applyPaletteMapping(ditheredData, palette, true);
        } else {
          // Original color mode logic
          coloredData = new ImageData(
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
        }

        ditheredData = coloredData

        // Apply HSV adjustments (hue, vibrance, saturation) if any are non-default
        if (hue !== 0 || vibrance !== 0 || saturation !== 100) {
          ditheredData = new ImageData(
            new Uint8ClampedArray(ditheredData.data),
            ditheredData.width,
            ditheredData.height
          )
          ditheredData = applyHSVAdjustments(ditheredData, hue, vibrance, saturation)
        }

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
        
        // Apply text overlay if enabled (for image mode)
        if (textOverlayEnabled) {
          const finalImageData = finalCtx.getImageData(0, 0, finalCanvas.width, finalCanvas.height)
          const textOverlay = configureTextOverlay()
          if (textOverlay) {
            const withText = textOverlay.applyTextOverlay(finalImageData, 0, 0, 1)
            finalCtx.putImageData(withText, 0, 0)
          }
        }
        
        // Convert to data URL and update state
        setEditedImage(finalCanvas.toDataURL())
      }
      image.src = originalImage
    }
    console.log("effect applied with algorithm:", algorithm)
  }, [originalImage, size, contrast, midtones, highlights, threshold, luminanceThresholdEnabled, algorithm, bloom, colorMode, redValue, greenValue, blueValue, singleColor, crtEnabled, rgbModeEnabled, selectedPalette, customPaletteRenderKey, textOverlayEnabled, textContent, textFontFamily, textFontSize, textColor, textStrokeColor, textStrokeWidth, textPositionX, textPositionY, textPositionType, textAlignment, textAnimationType, textAnimationDuration, textStartTime, textEndTime, textShadow, hue, vibrance, saturation, backgroundRemovalEnabled, maskSensitivity, featherEdgesEnabled, featherAmount]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update frame preview when current frame changes
  useEffect(() => {
    if (mediaType === 'video' && processedFrames.length > 0 && videoProcessor) {
      const framePreview = videoProcessor.getFramePreview(currentFrame)
      if (framePreview) {
        setEditedImage(framePreview)
      }
    }
  }, [currentFrame, mediaType, processedFrames, videoProcessor])

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

  function rgbToHsv(r, g, b) {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min
    
    let h = 0
    let s = 0
    const v = max
    
    if (delta !== 0) {
      s = delta / max
      if (r === max) {
        h = ((g - b) / delta) % 6
      } else if (g === max) {
        h = (b - r) / delta + 2
      } else {
        h = (r - g) / delta + 4
      }
      h = Math.round(h * 60)
      if (h < 0) h += 360
    }
    
    return [h, s, v]
  }

  function hsvToRgb(h, s, v) {
    const c = v * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = v - c
    
    let r = 0, g = 0, b = 0
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x
    }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ]
  }

  function applyHSVAdjustments(imageData, hueShift, vibranceAdjust, saturationPercent) {
    const data = imageData.data
    const saturationFactor = saturationPercent / 100
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Convert to HSV
      let [h, s, v] = rgbToHsv(r, g, b)
      
      // Apply hue shift
      h = (h + hueShift) % 360
      if (h < 0) h += 360
      
      // Apply saturation adjustment
      s = Math.max(0, Math.min(1, s * saturationFactor))
      
      // Apply vibrance (increase saturation of less saturated colors more)
      if (vibranceAdjust !== 0) {
        const vibranceFactor = 1 + (vibranceAdjust / 100)
        const adjustment = (1 - s) * (vibranceFactor - 1)
        s = Math.max(0, Math.min(1, s + adjustment))
      }
      
      // Convert back to RGB
      const [newR, newG, newB] = hsvToRgb(h, s, v)
      
      data[i] = clamp(newR)
      data[i + 1] = clamp(newG)
      data[i + 2] = clamp(newB)
    }
    
    return imageData
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
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button
              onClick={switchToImageMode}
              style={{
                flex: 1,
                background: mediaType === 'image' ? '#000000' : '#404040',
                border: '2px solid',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderBottomColor: '#808080',
                borderRightColor: '#808080',
                color: 'white',
                padding: '4px',
                fontSize: '0.6rem',
                cursor: 'pointer'
              }}
            >
              Image
            </button>
            <button
              onClick={() => setMediaType('video')}
              style={{
                flex: 1,
                background: mediaType === 'video' ? '#000000' : '#404040',
                border: '2px solid',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderBottomColor: '#808080',
                borderRightColor: '#808080',
                color: 'white',
                padding: '4px',
                fontSize: '0.6rem',
                cursor: 'pointer'
              }}
            >
              Video
            </button>
          </div>

          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <button
              onClick={handleSaveSettings}
              style={{
                flex: 1,
                background: '#000000',
                border: '2px solid',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderBottomColor: '#808080',
                borderRightColor: '#808080',
                color: '#00ff00',
                padding: '4px',
                fontSize: '0.6rem',
                cursor: 'pointer'
              }}
            >
              Save Settings
            </button>
            <label
              htmlFor="load-settings"
              style={{
                flex: 1,
                background: '#000000',
                border: '2px solid',
                borderTopColor: '#ffffff',
                borderLeftColor: '#ffffff',
                borderBottomColor: '#808080',
                borderRightColor: '#808080',
                color: '#00ff00',
                padding: '4px',
                fontSize: '0.6rem',
                cursor: 'pointer',
                textAlign: 'center',
                display: 'block'
              }}
            >
              Load Settings
              <input
                type="file"
                id="load-settings"
                accept=".json"
                onChange={handleLoadSettings}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {mediaType === 'image' ? (
            <>
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

              {originalImage && (
                <>
                  <div style={{ 
                    borderTop: '2px solid #808080', 
                    margin: '10px 0', 
                    padding: '10px 0 0 0' 
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                      {'>'} Image_to_Video_Animation_
                    </div>
                    
                    <div>{'>'} Animation_Type_</div>
                    <select
                      value={imageAnimationType}
                      onChange={(e) => setImageAnimationType(e.target.value)}
                    >
                      <option value="threshold-wave">Threshold Wave</option>
                      <option value="threshold-sweep">Threshold Sweep</option>
                      <option value="contrast-pulse">Contrast Pulse</option>
                      <option value="color-cycle">Color Cycle</option>
                      <option value="bloom-pulse">Bloom Pulse</option>
                      <option value="rgb-split">RGB Split</option>
                      <option value="glitch-wave">Glitch Wave</option>
                      <option value="all-params">All Parameters</option>
                    </select>

                    <div>{'>'} Duration_(seconds)_</div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={imageAnimationDuration}
                      onChange={(e) => setImageAnimationDuration(parseFloat(e.target.value))}
                    />
                    <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{imageAnimationDuration}s</div>

                    <div>{'>'} Frame_Rate_</div>
                    <input
                      type="range"
                      min="10"
                      max="60"
                      value={imageAnimationFrameRate}
                      onChange={(e) => setImageAnimationFrameRate(parseInt(e.target.value, 10))}
                    />
                    <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{imageAnimationFrameRate} fps</div>

                    <div>{'>'} Animation_Cycles_</div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={imageAnimationCycles}
                      onChange={(e) => setImageAnimationCycles(parseInt(e.target.value, 10))}
                    />
                    <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{imageAnimationCycles}</div>

                    <div>{'>'} Animation_Intensity_</div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round(imageAnimationIntensity * 100)}
                      onChange={(e) => setImageAnimationIntensity(parseInt(e.target.value, 10) / 100)}
                    />
                    <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{Math.round(imageAnimationIntensity * 100)}%</div>

                    <div className="file-input-container">
                      <button
                        onClick={generateAnimatedVideoFromImage}
                        disabled={!originalImage || isGeneratingImageVideo}
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
                          cursor: originalImage && !isGeneratingImageVideo ? 'pointer' : 'not-allowed',
                          opacity: originalImage && !isGeneratingImageVideo ? 1 : 0.5,
                          marginTop: '10px'
                        }}
                      >
                        {isGeneratingImageVideo ? 'Generating...' : 'Generate Animated Video'}
                      </button>
                      {isGeneratingImageVideo && (
                        <div style={{
                          fontSize: '0.5rem',
                          textAlign: 'center',
                          marginTop: '5px',
                          color: '#00ff00'
                        }}>
                          Generating frames... This may take a while.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="file-input-container">
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files[0]
                  if (file) {
                    handleVideoUpload(file)
                  }
                }}
              />
              <label htmlFor="video" className="file-input-label">
                Choose Video
              </label>
            </div>
          )}
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
            <option value="floydSteinbergSerpentine">Floyd-Steinberg (Serpentine)</option>
            <option value="falseFloydSteinberg">False Floyd-Steinberg</option>
            <option value="jarvisJudiceNinke">Jarvis-Judice-Ninke</option>
            <option value="atkinson">Atkinson</option>
            <option value="stucki">Stucki</option>
            <option value="burkes">Burkes</option>
            <option value="sierra">Sierra (3-row)</option>
            <option value="twoRowSierra">Sierra (Two-row)</option>
            <option value="sierraLite">Sierra Lite</option>
            <option value="bayerOrdered">Bayer Ordered 8x8</option>
            <option value="bayerOrdered4x4">Bayer Ordered 4x4</option>
            <option value="bayerOrdered16x16">Bayer Ordered 16x16</option>
            <option value="randomOrdered">Random Ordered</option>
            <option value="halftoneCircles">Halftone (Circles)</option>
            <option value="bitTone">Bit Tone</option>
            <option value="crossPlus">Cross Plus</option>
            <option value="asciiArt">ASCII Art</option>
            <option value="grain">Grain</option>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={rgbModeEnabled}
              onChange={(e) => setRgbModeEnabled(e.target.checked)}
              style={{
                width: '15px',
                height: '15px',
                cursor: 'pointer',
                accentColor: 'black'
              }}
            />
            <div style={{ margin: 0 }}>{'>'} RGB_Image_</div>
          </div>

          {rgbModeEnabled && (
            <div style={{
              borderTop: '2px solid #808080',
              margin: '10px 0',
              padding: '10px 0 0 0'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                {'>'} Palette_Settings_
              </div>

              <div>{'>'} Palette_Preset_</div>
              <select
                value={selectedPalette}
                onChange={(e) => setSelectedPalette(e.target.value)}
                style={{ marginBottom: '10px' }}
              >
                <option value="custom">Custom Palette</option>
                {Object.keys(PRESET_PALETTES).map(key => (
                  <option key={key} value={key}>{PRESET_PALETTES[key].name}</option>
                ))}
              </select>

              {selectedPalette === 'custom' && (
                <div style={{ marginTop: '10px' }}>
                  <div>{'>'} Custom_Colors_</div>
                  {customPaletteColors.map((color, index) => (
                    <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => {
                          const newColors = [...customPaletteColors];
                          newColors[index] = e.target.value;
                          setCustomPaletteColors(newColors);
                        }}
                        style={{ flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          const newColors = customPaletteColors.filter((_, i) => i !== index);
                          if (newColors.length > 0) {
                            setCustomPaletteColors(newColors);
                          }
                        }}
                        style={{
                          background: '#ff0000',
                          color: 'white',
                          border: 'none',
                          padding: '2px 5px',
                          fontSize: '0.6rem',
                          cursor: 'pointer'
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setCustomPaletteColors([...customPaletteColors, '#ffffff']);
                    }}
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
                      cursor: 'pointer',
                      marginTop: '5px'
                    }}
                  >
                    Add Color
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={manualRenderEnabled}
                      onChange={(e) => setManualRenderEnabled(e.target.checked)}
                      style={{
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer',
                        accentColor: 'black'
                      }}
                    />
                    <div style={{ margin: 0, fontSize: '0.6rem' }}>Manual Render</div>
                  </div>

                  {manualRenderEnabled && (
                    <button
                      onClick={() => setRenderTrigger(prev => prev + 1)}
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
                        cursor: 'pointer',
                        marginTop: '5px'
                      }}
                    >
                      Render Now
                    </button>
                  )}
                </div>
              )}

              <div style={{ marginTop: '10px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {'>'} Color_Adjustments_
                </div>

                <div>{'>'} Hue_Shift_</div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{hue}°</div>

                <div>{'>'} Vibrance_</div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={vibrance}
                  onChange={(e) => setVibrance(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{vibrance}%</div>

                <div>{'>'} Saturation_</div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{saturation}%</div>
              </div>
            </div>
          )}

          <div>{'>'} Color_Mode_</div>
          <select
            value={colorMode}
            onChange={(e) => setColorMode(e.target.value)}
            disabled={rgbModeEnabled}
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
                disabled={rgbModeEnabled}
              />
              <div>{'>'} Green_</div>
              <input
                type="range"
                min="0"
                max="255"
                value={greenValue}
                onChange={(e) => setGreenValue(parseInt(e.target.value, 10))}
                disabled={rgbModeEnabled}
              />
              <div>{'>'} Blue_</div>
              <input
                type="range"
                min="0"
                max="255"
                value={blueValue}
                onChange={(e) => setBlueValue(parseInt(e.target.value, 10))}
                disabled={rgbModeEnabled}
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
                disabled={rgbModeEnabled}
              />
            </>
            )}

            {!rgbModeEnabled && colorMode === 'rgb' && (
              <div style={{
                borderTop: '2px solid #808080',
                margin: '10px 0',
                padding: '10px 0 0 0'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  {'>'} Color_Adjustments_
                </div>

                <div>{'>'} Hue_Shift_</div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{hue}°</div>

                <div>{'>'} Vibrance_</div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={vibrance}
                  onChange={(e) => setVibrance(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{vibrance}%</div>

                <div>{'>'} Saturation_</div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value, 10))}
                />
                <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{saturation}%</div>
              </div>
            )}

            {/* Background Removal Section */}
            <div style={{
              borderTop: '2px solid #808080',
              margin: '10px 0',
              padding: '10px 0 0 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={backgroundRemovalEnabled}
                  onChange={(e) => {
                    setBackgroundRemovalEnabled(e.target.checked)
                    if (!e.target.checked) {
                      clearMaskCache()
                    }
                  }}
                  style={{
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                    accentColor: 'black'
                  }}
                />
                <div style={{ margin: 0, fontWeight: 'bold' }}>{'>'} Remove_Background_</div>
              </div>

              {backgroundRemovalEnabled && (
                <>
                  <div>{'>'} Mask_Sensitivity_</div>
                  <input
                    type="range"
                    min="0"
                    max="255"
                    value={maskSensitivity}
                    onChange={(e) => setMaskSensitivity(parseInt(e.target.value, 10))}
                  />
                  <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>Threshold: {maskSensitivity}</div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      checked={featherEdgesEnabled}
                      onChange={(e) => setFeatherEdgesEnabled(e.target.checked)}
                      style={{
                        width: '15px',
                        height: '15px',
                        cursor: 'pointer',
                        accentColor: 'black'
                      }}
                    />
                    <div style={{ margin: 0 }}>{'>'} Feather_Edges_</div>
                  </div>

                  {featherEdgesEnabled && (
                    <>
                      <div>{'>'} Edge_Feather_Amount_</div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={featherAmount}
                        onChange={(e) => setFeatherAmount(parseInt(e.target.value, 10))}
                      />
                      <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{featherAmount}px</div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Text Overlay Section - Available in both image and video modes */}
            <div style={{ 
              borderTop: '2px solid #808080', 
              margin: '10px 0', 
              padding: '10px 0 0 0' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={textOverlayEnabled}
                  onChange={(e) => setTextOverlayEnabled(e.target.checked)}
                  style={{
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer',
                    accentColor: 'black'
                  }}
                />
                <div style={{ margin: 0, fontWeight: 'bold' }}>{'>'} Text_Overlay_</div>
              </div>

                  {textOverlayEnabled && (
                    <>
                      <div>{'>'} Text_Content_</div>
                      <input
                        type="text"
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#000',
                          color: '#fff',
                          border: '1px solid #808080',
                          padding: '4px',
                          fontSize: '0.6rem',
                          marginBottom: '5px'
                        }}
                      />

                      <div>{'>'} Font_Family_</div>
                      <select
                        value={textFontFamily}
                        onChange={(e) => setTextFontFamily(e.target.value)}
                      >
                        {FONT_FAMILIES.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>

                      <div>{'>'} Font_Size_</div>
                      <input
                        type="range"
                        min="12"
                        max="200"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(parseInt(e.target.value, 10))}
                      />
                      <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{textFontSize}px</div>

                      <div>{'>'} Text_Color_</div>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        style={{ width: "100%", marginBottom: '5px' }}
                      />

                      <div>{'>'} Stroke_Color_</div>
                      <input
                        type="color"
                        value={textStrokeColor}
                        onChange={(e) => setTextStrokeColor(e.target.value)}
                        style={{ width: "100%", marginBottom: '5px' }}
                      />

                      <div>{'>'} Stroke_Width_</div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={textStrokeWidth}
                        onChange={(e) => setTextStrokeWidth(parseInt(e.target.value, 10))}
                      />
                      <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{textStrokeWidth}px</div>

                      <div>{'>'} Position_Type_</div>
                      <select
                        value={textPositionType}
                        onChange={(e) => setTextPositionType(e.target.value)}
                      >
                        <option value="percent">Percentage</option>
                        <option value="pixels">Pixels</option>
                      </select>

                      <div>{'>'} Position_X_</div>
                      <input
                        type="range"
                        min="0"
                        max={textPositionType === 'percent' ? 100 : 1920}
                        value={textPositionX}
                        onChange={(e) => setTextPositionX(parseInt(e.target.value, 10))}
                      />
                      <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>
                        {textPositionX}{textPositionType === 'percent' ? '%' : 'px'}
                      </div>

                      <div>{'>'} Position_Y_</div>
                      <input
                        type="range"
                        min="0"
                        max={textPositionType === 'percent' ? 100 : 1080}
                        value={textPositionY}
                        onChange={(e) => setTextPositionY(parseInt(e.target.value, 10))}
                      />
                      <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>
                        {textPositionY}{textPositionType === 'percent' ? '%' : 'px'}
                      </div>

                      <div>{'>'} Text_Alignment_</div>
                      <select
                        value={textAlignment}
                        onChange={(e) => setTextAlignment(e.target.value)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>

                      <div>{'>'} Animation_Type_</div>
                      <select
                        value={textAnimationType}
                        onChange={(e) => setTextAnimationType(e.target.value)}
                      >
                        {TEXT_ANIMATION_TYPES.map(anim => (
                          <option key={anim.value} value={anim.value}>{anim.label}</option>
                        ))}
                      </select>

                      {textAnimationType !== 'none' && (
                        <>
                          <div>{'>'} Animation_Duration_(s)_</div>
                          <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={textAnimationDuration}
                            onChange={(e) => setTextAnimationDuration(parseFloat(e.target.value))}
                          />
                          <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{textAnimationDuration}s</div>

                          <div>{'>'} Start_Time_(s)_</div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={textStartTime}
                            onChange={(e) => setTextStartTime(parseFloat(e.target.value))}
                          />
                          <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{textStartTime}s</div>

                          <div>{'>'} End_Time_(s)_</div>
                          <input
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={textEndTime}
                            onChange={(e) => setTextEndTime(parseFloat(e.target.value))}
                          />
                          <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{textEndTime}s</div>
                        </>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                        <input
                          type="checkbox"
                          checked={textShadow}
                          onChange={(e) => setTextShadow(e.target.checked)}
                          style={{
                            width: '15px',
                            height: '15px',
                            cursor: 'pointer',
                            accentColor: 'black'
                          }}
                        />
                        <div style={{ margin: 0 }}>{'>'} Text_Shadow_</div>
                      </div>
                    </>
                  )}
            </div>

            {mediaType === 'video' && (
            <>
             {videoSource === 'image' && (
               <div style={{
                 padding: '8px',
                 background: '#404040',
                 border: '2px solid #00ff00',
                 marginBottom: '10px',
                 fontSize: '0.6rem',
                 textAlign: 'center'
               }}>
                 Video generated from image
               </div>
             )}

             <div>{'>'} Frame_Rate_</div>
             <input
               type="range"
               min="10"
               max="60"
               value={frameRate}
               onChange={(e) => setFrameRate(parseInt(e.target.value, 10))}
               disabled={videoSource === 'image'}
             />
             <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>{frameRate} fps</div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               <input
                 type="checkbox"
                 checked={glitchEnabled}
                 onChange={(e) => setGlitchEnabled(e.target.checked)}
                 disabled={videoSource === 'image'}
                 style={{
                   width: '15px',
                   height: '15px',
                   cursor: videoSource === 'image' ? 'not-allowed' : 'pointer',
                   accentColor: 'black'
                 }}
               />
               <div style={{ margin: 0 }}>{'>'} Glitch_Effects_</div>
             </div>

             {glitchEnabled && (
               <>
                 <div>{'>'} Glitch_Effect_</div>
                 <select
                   value={selectedGlitchEffect}
                   onChange={(e) => setSelectedGlitchEffect(e.target.value)}
                   disabled={videoSource === 'image'}
                 >
                   <option value="dataMosh">Data Mosh</option>
                   <option value="pixelSort">Pixel Sort</option>
                   <option value="chromaticAberration">Chromatic Aberration</option>
                   <option value="digitalCorruption">Digital Corruption</option>
                 </select>

                 <div>{'>'} Glitch_Intensity_</div>
                 <input
                   type="range"
                   min="0"
                   max="100"
                   value={glitchIntensity * 100}
                   onChange={(e) => setGlitchIntensity(parseInt(e.target.value, 10) / 100)}
                   disabled={videoSource === 'image'}
                 />
               </>
             )}

             {processedFrames.length > 0 && (
               <>
                 <div>{'>'} Frame_Navigation_</div>
                 <input
                   type="range"
                   min="0"
                   max={processedFrames.length - 1}
                   value={currentFrame}
                   onChange={(e) => setCurrentFrame(parseInt(e.target.value, 10))}
                 />
                 <div style={{ fontSize: '0.5rem', textAlign: 'center' }}>
                   Frame {currentFrame + 1} / {processedFrames.length}
                 </div>
               </>
             )}

             {videoSource === 'upload' && (
               <div className="file-input-container">
                 <button
                   onClick={processVideo}
                   disabled={!videoProcessor || isProcessingVideo}
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
                     cursor: videoProcessor && !isProcessingVideo ? 'pointer' : 'not-allowed',
                     opacity: videoProcessor && !isProcessingVideo ? 1 : 0.5,
                     marginTop: '10px'
                   }}
                 >
                   {isProcessingVideo ? 'Processing...' : 'Process Video'}
                 </button>
                 {isProcessingVideo && (
                   <div style={{
                     fontSize: '0.5rem',
                     textAlign: 'center',
                     marginTop: '5px',
                     color: '#00ff00'
                   }}>
                     Processing frames... This may take a while.
                   </div>
                 )}
               </div>
             )}

             {processedFrames.length > 0 && (
               <>
                 <div className="file-input-container">
                   <button
                     onClick={() => handleVideoExport('gif')}
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
                       cursor: 'pointer',
                       marginTop: '5px'
                     }}
                   >
                     Export as GIF
                   </button>
                 </div>

                 <div className="file-input-container">
                   <button
                     onClick={() => handleVideoExport('mp4')}
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
                       cursor: 'pointer',
                       marginTop: '5px'
                     }}
                   >
                     Export as MP4
                   </button>
                 </div>
               </>
             )}
            </>
            )}

            <div className="file-input-container">
            <button
             onClick={handleExport}
             disabled={!editedImage || mediaType === 'video'}
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
               cursor: editedImage && mediaType !== 'video' ? 'pointer' : 'not-allowed',
               opacity: editedImage && mediaType !== 'video' ? 1 : 0.5,
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
