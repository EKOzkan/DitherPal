# Text Overlay Examples

This document provides examples and use cases for the text overlay feature in DitherPal.

## Basic Text Overlay

The simplest way to add text to your video:

1. Switch to Video mode
2. Upload a video or generate one from an image
3. Enable "Text_Overlay" checkbox
4. Enter your text in "Text_Content"
5. Process the video
6. Export with text included

## Animation Examples

### Typewriter Effect
Perfect for revealing text character by character, like a retro terminal or typewriter.

**Settings:**
- Animation Type: Typewriter
- Animation Duration: 2s
- Start Time: 0s
- Font Family: Courier New (for authentic typewriter look)
- Stroke Width: 0 (no outline for cleaner look)

**Use Case:** Credits, subtitles, narrative text

### Slide In from Left
Great for intro titles and announcements.

**Settings:**
- Animation Type: Slide from Left
- Animation Duration: 1s
- Position: 50% X, 50% Y
- Text Alignment: Center

**Use Case:** Title cards, transitions, announcements

### Bounce Effect
Eye-catching animation for emphasis.

**Settings:**
- Animation Type: Bounce
- Animation Duration: 1.5s
- Font Size: 72px
- Text Shadow: Enabled

**Use Case:** Call-to-action text, important messages

### Wave Effect
Creates a flowing, animated wave through the text.

**Settings:**
- Animation Type: Wave
- Font Family: Impact or Arial Black
- Font Size: 60-80px
- Text Color: Bright color (e.g., #00ff00, #ff00ff)

**Use Case:** Retro aesthetic, psychedelic effects, music videos

### Glow Pulse
Creates a pulsing glow effect, perfect for neon or retro themes.

**Settings:**
- Animation Type: Glow Pulse
- Font Family: Impact
- Text Color: Bright neon color
- Stroke Color: Darker shade of text color
- Stroke Width: 3-5px
- Text Shadow: Enabled

**Use Case:** Neon signs, retro arcade aesthetic, emphasis

## Position Examples

### Center Title
**Settings:**
- Position Type: Percent
- Position X: 50%
- Position Y: 20%
- Text Alignment: Center

### Lower Third Subtitle
**Settings:**
- Position Type: Percent
- Position X: 50%
- Position Y: 80%
- Text Alignment: Center
- Font Size: 36px

### Corner Watermark
**Settings:**
- Position Type: Percent
- Position X: 90%
- Position Y: 95%
- Text Alignment: Right
- Font Size: 24px
- Animation Type: None

## Font Recommendations

### Retro/Pixel Art Look
- **Courier New**: Classic monospace, great for terminal effects
- **monospace**: System monospace font, very readable

### Bold Impact
- **Impact**: Strong, bold letters for emphasis
- **Arial Black**: Heavy weight, great visibility

### Artistic/Creative
- **cursive**: Handwriting-style text
- **fantasy**: Decorative text for special effects
- **Comic Sans MS**: Casual, friendly appearance

### Classic/Professional
- **Times New Roman**: Traditional serif font
- **Georgia**: Elegant serif font
- **Arial**: Clean, modern sans-serif

## Timing Tips

### Text Visibility Windows
Use Start Time and End Time to control when text appears:

- **Full Video**: Start Time: 0s, End Time: (video duration)
- **Opening Title**: Start Time: 0s, End Time: 3s
- **Mid-Roll Text**: Start Time: 5s, End Time: 8s
- **End Credits**: Start Time: (duration - 3s), End Time: (duration)

### Animation Duration Guidelines
- **Quick Pop**: 0.3-0.5s (fast, attention-grabbing)
- **Smooth Transition**: 1-1.5s (balanced, professional)
- **Slow Reveal**: 2-3s (dramatic, emphasis)

## Combining with Dithering Effects

### Pixel Art + Typewriter
1. Use Bayer Ordered 8x8 dithering
2. Courier New or monospace font
3. Typewriter animation
4. Result: Retro computer terminal aesthetic

### Glitch + Wave Text
1. Enable glitch effects (Data Mosh or Digital Corruption)
2. Impact or Arial Black font
3. Wave animation
4. Bright contrasting colors
5. Result: Cyberpunk/vaporwave aesthetic

### Halftone + Bounce
1. Use Halftone Circles dithering
2. Impact font with heavy stroke
3. Bounce animation
4. Result: Comic book style

## Color Combinations

### High Contrast (Best Readability)
- White text (#ffffff) with black stroke (#000000)
- Black text (#000000) with white stroke (#ffffff)

### Neon/Cyberpunk
- Cyan (#00ffff) with purple stroke (#ff00ff)
- Pink (#ff00ff) with blue stroke (#0000ff)
- Green (#00ff00) with black stroke (#000000)

### Retro/Vapor Wave
- Pink (#ff6ec7) with purple stroke (#9d00ff)
- Cyan (#00d9ff) with purple stroke (#9d00ff)

### Pastel/Soft
- Light pink (#ffb3d9) with white stroke (#ffffff)
- Light blue (#b3d9ff) with white stroke (#ffffff)

## Advanced Techniques

### Multiple Text Layers (Future Feature)
Currently, the system supports one text layer at a time. However, you can:
1. Process video with first text
2. Export the result
3. Re-import and add second text layer
4. Export final result

### Creating Subtitle-Style Text
1. Position Type: Percent
2. Position X: 50%, Y: 85%
3. Text Alignment: Center
4. Font Size: 36-48px
5. Stroke Width: 2-3px (for readability over video)
6. Animation Type: Fade In (duration 0.3s)
7. Update text content and timing for each subtitle segment

### Animated Timestamps
1. Use Typewriter effect
2. Courier New font
3. Corner position (e.g., 5% X, 5% Y)
4. Animation duration matching frame rate
5. Result: Terminal-style timestamp overlay

## Performance Tips

1. **Font Size**: Larger fonts render faster but take more space
2. **Stroke Width**: Heavy strokes increase render time slightly
3. **Animation Complexity**: Wave and Glow Pulse are more CPU-intensive
4. **Text Length**: Shorter text renders faster
5. **Shadow Effects**: Disable shadows for faster processing if needed

## Troubleshooting

### Text Not Visible
- Check Start Time and End Time are within video duration
- Ensure text color contrasts with background
- Verify position is within canvas bounds
- Try increasing font size

### Animation Not Smooth
- Increase frame rate (24-30+ fps recommended)
- Reduce animation duration for snappier feel
- Ensure sufficient animation duration for smooth transitions

### Text Cut Off
- Switch to percentage-based positioning for responsive layout
- Adjust alignment (center alignment prevents left/right cutoff)
- Reduce font size if text is too wide

## Best Practices

1. **Readability First**: Always ensure text is readable
2. **Contrast**: Use stroke/outline for text over complex backgrounds
3. **Timing**: Give viewers enough time to read the text
4. **Animation**: Match animation style to content mood
5. **Font Choice**: Consider the overall aesthetic and mood
6. **Testing**: Preview frames before exporting full video
7. **Subtle Effects**: Sometimes less is more with animations

## Example Workflows

### Music Video Title
1. Generate animated video from album art
2. Animation Type: Color Cycle or RGB Split
3. Add text overlay with artist/song name
4. Text Animation: Zoom or Glow Pulse
5. Font: Impact or Arial Black
6. Bright neon colors
7. Center position
8. Export as GIF

### Retro Terminal Effect
1. Upload video or use static image
2. Dithering: ASCII Art or Bayer Ordered
3. Color Mode: Single Color (green)
4. Add text overlay
5. Font: Courier New or monospace
6. Animation: Typewriter
7. Position: Top-left corner
8. Export as WebM

### Cinematic Title Card
1. Generate video with Bloom Pulse animation
2. Add text overlay
3. Font: Times New Roman or Georgia
4. Animation: Fade In
5. Position: Center
6. Large font size (80-100px)
7. Subtle stroke for depth
8. Export as WebM
