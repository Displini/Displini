# Landing Page

This folder contains all landing page related files and assets.

## Structure

```
landing/
├── assets/           # Static assets (images, videos, logos)
│   ├── images/      # Landing page images
│   ├── videos/      # Landing page videos
│   └── logos/       # Logo files
├── components/      # Landing page React components
├── hooks/           # Landing page specific hooks
├── Landing.tsx      # Main landing page component
├── landing.module.css # Landing page styles
└── constants.ts     # Landing page constants
```

## Components

- `LandingHero.tsx` - Hero section
- `LandingFeatures.tsx` - Features showcase
- `LandingCarousel.tsx` - Interactive carousel
- `LandingAbout.tsx` - About/Story section
- `LandingFAQ.tsx` - FAQ section
- `LandingQR.tsx` - QR code download section
- `LandingDeviceSync.tsx` - Device sync section
- `LandingCTA.tsx` - Call to action
- `LandingMadeBy.tsx` - Made by section
- `LandingFooter.tsx` - Footer
- `Header.tsx` - Landing page header

## Usage

The landing page is imported in `client/src/App.tsx` and rendered at the root route `/`.

