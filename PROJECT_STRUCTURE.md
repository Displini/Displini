# Displini Project Structure

## New Folder Organization

### `/landing/` - Landing Page
All landing page files and assets are organized here:
- `components/` - Landing page React components
- `hooks/` - Landing page specific hooks
- `assets/` - Static assets (images, videos, logos)
  - `images/` - Landing page images
  - `videos/` - Landing page videos  
  - `logos/` - Logo files
- `Landing.tsx` - Main landing page component
- `landing.module.css` - Landing page styles
- `constants.ts` - Landing page constants

**Note:** The working landing page code is still in `client/src/app/pages/landing/` for import compatibility. The `/landing/` folder contains a copy/reference.

### `/displini-style-guide/` - Design System Resources
- `logo/` - All Displini logo variations
- `DESIGN_CHEATSHEET.txt` - Quick reference for developers (colors, fonts, spacing)

### `/app/` - Main Application Code
Reference copy of the main application code structure.

**Note:** The working app code is still in `client/src/app/` for import compatibility. The `/app/` folder contains a copy/reference.

### `/ai/` - AI Documentation
Documentation for AI assistants:
- Design system guide
- Deployment instructions
- Error handling guide
- Algorithm specifications
- Backend readiness guide

## Current Working Structure

The application currently uses this structure for imports:

```
client/src/app/        # Working app code (imports: @/app/...)
client/src/hooks/      # React hooks
client/src/lib/        # Utilities
client/public/         # Public assets (still used by the app)
```

## Migration Notes

If you want to fully migrate to the new structure:
1. Update all imports from `@/app/pages/landing/...` to new landing folder
2. Update Vite config aliases if needed
3. Update asset paths in components

The new organized folders serve as reference and documentation while maintaining working code in the original locations.

