# AI Documentation

This folder contains important documentation files for AI assistants to understand the Displini project structure, architecture, and development guidelines.

## Files in this folder:

1. **DESIGN_SYSTEM.md** - Comprehensive design system guide with typography, colors, spacing, components, and animations
2. **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions for various platforms
3. **ERROR_HANDLING_GUIDE.md** - Error handling patterns and utilities used across the application
4. **ENV_TEMPLATE.md** - Environment variables template for setup
5. **BACKEND_READINESS.md** - Backend integration guide for adaptive density timeline algorithm
6. **ALGORITHM_SPECIFICATION.md** - Complete algorithm specification for adaptive density-based timeline scaling

## Project Structure

```
Displini/
├── ai/                      # AI documentation (this folder)
├── landing/                 # Landing page code and assets
│   ├── assets/             # Images, videos, logos
│   ├── components/         # Landing page components
│   └── hooks/              # Landing page hooks
├── displini-style-guide/   # Design system resources
│   ├── logo/               # Logo files
│   └── DESIGN_CHEATSHEET.txt
├── app/                    # Main application code (reference copy)
│   ├── components/         # Shared components
│   ├── features/           # Feature modules
│   ├── pages/              # Page components
│   └── shared/             # Shared app components
├── client/                 # Client source code
│   ├── src/
│   │   ├── app/            # Working app code (imports use @/app/...)
│   │   ├── hooks/          # React hooks
│   │   ├── lib/            # Utilities
│   │   └── ...
│   └── public/             # Public assets
└── server/                 # Server code
```

## Main README

The main `README.md` file is located at the project root and contains:
- Project overview
- Features list
- Tech stack
- Installation instructions
- Project structure
- Development guidelines

---

**Note:** All unnecessary summary, optimization, and report files have been removed to keep the documentation clean and focused.
