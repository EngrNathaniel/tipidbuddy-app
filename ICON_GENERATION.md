# App Icon Generation Guide

Since I cannot generate images due to quota limits, you'll need to create the app icons. Here are three easy methods:

## Method 1: Use an Online Icon Generator (Easiest)

### Option A: RealFaviconGenerator (Recommended)
1. Go to https://realfavicongenerator.net/
2. Upload a logo or image (512x512 recommended)
3. Configure settings:
   - iOS: Enable "Add a solid, plain background color" with #10B981 (emerald green)
   - Android: Use the same color
4. Generate icons
5. Download the package
6. Extract and copy these files to `public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`

### Option B: PWA Asset Generator
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload a 512x512 image
3. Click "Generate"
4. Download the zip file
5. Copy the required icons to `public/`

## Method 2: Use Figma or Canva (Custom Design)

### Figma
1. Create a 512x512 frame
2. Design your icon:
   - Background: White or emerald green (#10B981)
   - Icon: Piggy bank, wallet, or peso sign
   - Keep it simple and recognizable
3. Export as PNG:
   - 192x192 → `icon-192.png`
   - 512x512 → `icon-512.png`
   - 180x180 → `apple-touch-icon.png`

### Canva
1. Go to https://www.canva.com/
2. Create custom size: 512x512
3. Search for "app icon" templates
4. Customize with emerald green (#10B981)
5. Download as PNG
6. Resize for different sizes using online tools

## Method 3: Use AI Image Generators

### DALL-E, Midjourney, or Stable Diffusion
Prompt:
```
A modern, minimalist app icon for a Filipino student expense tracker app. 
Features a simple piggy bank or wallet icon in emerald green (#10B981) 
on a white background. Flat design, no text, 512x512 pixels, 
suitable for mobile app icon.
```

## Quick Placeholder Icons

If you want to test immediately, you can use placeholder icons:

### Create Simple Colored Squares (Temporary)
1. Use any image editor
2. Create 512x512 canvas
3. Fill with emerald green (#10B981)
4. Add white text "TB" (for TipidBuddy)
5. Export as PNG
6. Resize to 192x192 and 180x180

## Required Files

Place these in the `public/` folder:

```
public/
├── icon-192.png    (192x192 pixels)
├── icon-512.png    (512x512 pixels)
└── apple-touch-icon.png (180x180 pixels)
```

## Design Guidelines

For best results:
- **Simple**: Should be recognizable at small sizes (48x48)
- **Contrast**: Use high contrast between icon and background
- **No text**: Icons work better without text
- **Centered**: Keep the main element centered
- **Padding**: Leave 10-15% padding around edges
- **Colors**: Use emerald green (#10B981) as primary color

## Verification

After adding icons:
1. Check they appear in `public/` folder
2. Restart dev server: `npm run dev`
3. Open http://localhost:5173
4. Check browser console for any icon loading errors
5. Test PWA installation on mobile

## Alternative: Use Existing Logo

If you have an existing logo:
1. Resize it to 512x512
2. Add padding if needed
3. Export in required sizes
4. Done!
