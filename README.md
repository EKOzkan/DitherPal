# DitherPal

DitherPal is a powerful web-based image and video dithering tool that allows you to apply various dithering algorithms and effects to your media. Built with React and Vite, it offers a range of features for creating artistic and retro-style effects with both images and videos.

## Features

### Image Processing
- Multiple dithering algorithms:
  - Floyd-Steinberg
  - Jarvis-Judice-Ninke
  - Atkinson
  - Stucki
  - Burkes
  - Sierra
  - Bayer Ordered
  - Random Ordered
  - Bit Tone
  - Cross Plus
  - ASCII Art
  - Halftone Circles
  - Grain
- Image adjustments:
  - Size
  - Contrast
  - Midtones
  - Highlights
  - Luminance threshold
- Color modes:
  - RGB with individual channel control
  - Single color with color picker
- Bloom effect
- CRT overlay effect

### Image-to-Video Animation (NEW!)
- Convert static images into animated videos with dithering effects
- Multiple animation types:
  - **Threshold Wave**: Pulsing threshold with sine wave pattern
  - **Threshold Sweep**: Linear sweep through threshold values
  - **Contrast Pulse**: Animated contrast oscillation
  - **Color Cycle**: Cycle through HSL color spectrum
  - **Bloom Pulse**: Pulsing bloom/glow effect
  - **RGB Split**: Independent RGB channel animation with phase offsets
  - **Glitch Wave**: Animated glitch intensity
  - **All Parameters**: Complex multi-parameter animation
- Configurable settings:
  - Duration (1-10 seconds)
  - Frame rate (10-60 fps)
  - Animation cycles (1-10 repetitions)
  - Animation intensity (0-100%)
- Export as GIF or WebM
- Real-time frame preview and navigation

### Video Processing
- Video upload and frame extraction
- Animated dithering effects that change over time
- Multiple glitch effects:
  - Data Mosh
  - Pixel Sort
  - Chromatic Aberration
  - Digital Corruption
- Adjustable frame rate (10-60 fps)
- Frame-by-frame preview and navigation
- Export options:
  - GIF export with adjustable quality
  - WebM export (MP4-compatible format)
- All existing dithering algorithms work with video
- Time-based animation for glitch effects

### Text Overlay for Video (NEW!)
- Add animated text overlays to video output
- Multiple font families:
  - Arial, Arial Black, Courier New, Comic Sans MS
  - Georgia, Impact, Times New Roman, Trebuchet MS
  - Verdana, Helvetica, monospace, cursive, fantasy
- Text animation types:
  - **Typewriter**: Reveals text character by character
  - **Fade In**: Gradually increases opacity
  - **Slide**: Slides from left, right, top, or bottom
  - **Zoom**: Scales text from small to normal size
  - **Bounce**: Bounces text into position
  - **Rotate**: Rotates text into position
  - **Wave**: Creates wave motion through letters
  - **Glow Pulse**: Pulsing glow effect
  - **None**: Static text without animation
- Configurable text properties:
  - Text content, font family, and font size (12-200px)
  - Text color and stroke (outline) color
  - Stroke width for text outline (0-10px)
  - Position (percentage or pixel-based coordinates)
  - Text alignment (left, center, right)
  - Animation timing (duration, start time, end time)
  - Optional drop shadow effect
- Works with both uploaded videos and image-to-video animations
- Text is rendered on each frame during processing

### UI Features
- Toggle between Image and Video modes
- Pan and zoom functionality for images
- Draggable retro-style settings panel
- Real-time preview
- Processing progress indicators

## Usage

### Image Mode
1. Visit [https://ekozkan.github.io/DitherPal/](https://ekozkan.github.io/DitherPal/)
2. Make sure "Image" mode is selected
3. Click "Choose Image" to upload an image
4. Adjust the settings to create your desired effect
5. Pan and zoom to explore your creation
6. Click "Export Image" to download your processed image

### Image-to-Video Animation (NEW!)
1. Stay in **Image** mode and upload your image
2. Scroll down to the **Image_to_Video_Animation** panel
3. Choose an animation type, set duration/frame rate/cycles/intensity
4. Click **Generate Animated Video** – the app will switch to Video mode when ready
5. Preview the animated frames and export as GIF or WebM

### Video Mode
1. Click "Video" mode in the settings panel
2. Click "Choose Video" to upload a video file
3. Adjust frame rate for processing (higher values = smoother but larger files)
4. Optionally enable glitch effects and select type:
   - Data Mosh: Creates horizontal line shifts and distortion
   - Pixel Sort: Sorts pixels based on brightness
   - Chromatic Aberration: Separates RGB channels with animation
   - Digital Corruption: Creates blocky corruption patterns
5. Adjust glitch intensity for more/less dramatic effects
6. Click "Process Video" to apply effects (this may take some time)
7. Use the frame navigation slider to preview different frames
8. Export as GIF or WebM using the respective buttons

### Adding Text Overlay to Video (NEW!)
1. In **Video** mode (either with uploaded video or generated from image)
2. Enable the **Text_Overlay** checkbox in the settings panel
3. Configure your text:
   - **Text Content**: Enter the text you want to display
   - **Font Family**: Choose from 13 different font options
   - **Font Size**: Adjust size from 12px to 200px
   - **Text Color**: Pick the main text color
   - **Stroke Color**: Choose outline/border color
   - **Stroke Width**: Adjust outline thickness (0-10px)
4. Set text position:
   - **Position Type**: Choose percentage (relative) or pixels (absolute)
   - **Position X/Y**: Set horizontal and vertical position
   - **Text Alignment**: Choose left, center, or right alignment
5. Configure animation:
   - **Animation Type**: Select from 11 different animation effects
   - **Animation Duration**: How long the animation takes (0.1-5s)
   - **Start Time**: When the text appears in the video (0-30s)
   - **End Time**: When the text disappears from the video (0-30s)
   - **Text Shadow**: Enable/disable drop shadow effect
6. Process your video with "Process Video" or "Generate Animated Video"
7. The text will be rendered on each frame according to your settings
8. Export with text overlay included

## Development

To run this project locally:

1. Clone the repository
```bash
git clone https://github.com/ekozkanDitherPal.git
cd DitherPal
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

5. Run linter
```bash
npm run lint
```

## Technical Details

### Image-to-Video Animation
- Takes a single static image and generates multiple frames with varying dithering parameters
- Animation parameters are interpolated using mathematical functions (sine waves, linear sweeps, etc.)
- Each frame applies the dithering algorithm with different settings based on time progress
- Supports smooth looping animations through cyclic parameter variation
- Uses the same export pipeline as video processing (GIF/WebM)

### Video Processing
- Videos are processed frame-by-frame using Canvas API
- Each frame is treated as an individual image and processed with the same dithering algorithms
- Glitch effects are time-based, creating animated variations across frames
- Export uses MediaRecorder API for WebM and gif.js library for GIF export
- Processing is done asynchronously to maintain UI responsiveness

### Text Overlay
- Text is rendered on each frame after dithering using Canvas 2D text rendering
- Animation progress is calculated based on frame timestamp and animation settings
- Supports multiple easing functions (ease-in-out-quad, bounce) for smooth animations
- Text transformations (rotation, scale, translation) are applied using canvas transforms
- Character-by-character rendering enables advanced effects like typewriter and wave
- Text layers are composited onto processed frames before export
- All text properties are configurable per-layer for future multi-text support

### Performance Considerations
- Video processing and image-to-video generation are computationally intensive
- Frame rate affects both processing time and output file size
- Lower resolutions and frame rates are recommended for faster processing
- Image-to-video animation is generally faster than video processing since it reuses the same source
- GIF export may fall back to WebM if gif.js library is unavailable

## License

MIT License
