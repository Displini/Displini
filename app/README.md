# App Code

This folder contains a copy/reference of the main application code.

## Note

**The actual working app code is located at `client/src/app/`** to maintain import paths.

This folder serves as documentation/reference. If you want to reorganize and update all imports, the main app code would need to be moved here and all import paths throughout the codebase would need to be updated.

## Current Structure

```
client/src/app/     # Working app code (imports reference @/app/...)
app/                # Reference copy of app code
```

## Main App Components

- `components/` - Shared UI components and components
- `features/` - Feature-specific code (todo, calendar, reminders)
- `pages/` - Page components (routes)
- `shared/` - Shared app components
- `types/` - TypeScript type definitions

