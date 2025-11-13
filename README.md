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

### Video Processing (NEW!)
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

### Video Mode (NEW!)
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

### Video Processing
- Videos are processed frame-by-frame using Canvas API
- Each frame is treated as an individual image and processed with the same dithering algorithms
- Glitch effects are time-based, creating animated variations across frames
- Export uses MediaRecorder API for WebM and gif.js library for GIF export
- Processing is done asynchronously to maintain UI responsiveness

### Performance Considerations
- Video processing is computationally intensive and may take time for longer videos
- Frame rate affects both processing time and output file size
- Lower resolutions and frame rates are recommended for faster processing
- GIF export may fall back to WebM if gif.js library is unavailable

## License

MIT License
