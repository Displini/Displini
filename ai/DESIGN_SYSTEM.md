# 🎨 Displini Design System

**A comprehensive guide to maintaining visual consistency across the entire application.**

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [Typography](#typography)
3. [Colors](#colors)
4. [Spacing](#spacing)
5. [Components](#components)
6. [Animations](#animations)
7. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### Import the Design System

```typescript
import { 
  typography, 
  colors, 
  components, 
  animations 
} from '@/lib/designSystem';
```

### Use in Components

```typescript
// Typography
<h1 style={{ fontFamily: typography.fontFamily.primary }}>
  Welcome to Displini
</h1>

// Colors
<div style={{ background: colors.gradients.primary }}>
  Gradient Background
</div>

// Component Classes
<button className={components.button.base + ' ' + components.button.variants.primary}>
  Click Me
</button>
```

---

## 📝 Typography

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `typography.fontFamily.primary` | **Satoshi** | Body text, headings, UI elements |
| `typography.fontFamily.secondary` | **Manrope** | Alternative headings, subtext |
| `typography.fontFamily.mono` | **SF Mono** | Code snippets, technical text |

### Font Sizes

| Token | Size | Usage |
|-------|------|-------|
| `typography.fontSize.xs` | 12px | Small labels, captions |
| `typography.fontSize.sm` | 14px | Secondary text |
| `typography.fontSize.base` | 16px | Body text (default) |
| `typography.fontSize.lg` | 18px | Large body text |
| `typography.fontSize.xl` | 20px | Small headings |
| `typography.fontSize['2xl']` | 24px | Section headings |
| `typography.fontSize['3xl']` | 30px | Page headings |
| `typography.fontSize['4xl']` | 36px | Hero headings |
| `typography.fontSize['5xl']` | 48px | Large hero text |
| `typography.fontSize['6xl']` | 60px | Extra large hero |
| `typography.fontSize['7xl']` | 72px | Massive displays |

### Font Weights

```typescript
typography.fontWeight.light      // 300
typography.fontWeight.regular    // 400
typography.fontWeight.medium     // 500
typography.fontWeight.semibold   // 600
typography.fontWeight.bold       // 700
typography.fontWeight.black      // 900
```

### Example Usage

```tsx
<h1 
  className="text-6xl font-bold"
  style={{ fontFamily: typography.fontFamily.primary }}
>
  Welcome to Displini
</h1>

<p 
  className="text-lg font-regular text-gray-700"
  style={{ fontFamily: typography.fontFamily.primary }}
>
  Track your health, fitness, and productivity in one place.
</p>
```

---

## 🎨 Colors

### Brand Colors

```typescript
colors.brand.primary    // #30C4FF - Displini Blue
colors.brand.secondary  // #DB1DD8 - Displini Pink
colors.brand.tertiary   // #00FF99 - Displini Green
```

### Gradients

```typescript
colors.gradients.primary    // Blue → Pink
colors.gradients.secondary  // Pink → Green
colors.gradients.tertiary   // Blue → Green
colors.gradients.full       // Blue → Pink → Green
```

**Usage:**

```tsx
<div style={{ background: colors.gradients.primary }}>
  Gradient Background
</div>

<div className="bg-gradient-to-r from-blue-500 to-purple-600">
  Tailwind Gradient
</div>
```

### Neutral Colors

```typescript
colors.neutral.white       // #FFFFFF
colors.neutral.offWhite    // #F5F5F5
colors.neutral.lightGray   // #E5E5E5
colors.neutral.gray        // #9CA3AF
colors.neutral.darkGray    // #4B5563
colors.neutral.charcoal    // #1F2937
colors.neutral.black       // #000000
```

### Semantic Colors

```typescript
colors.semantic.success    // #10B981 - Green
colors.semantic.warning    // #F59E0B - Orange
colors.semantic.error      // #EF4444 - Red
colors.semantic.info       // #3B82F6 - Blue
```

---

## 📏 Spacing

Consistent spacing creates visual harmony:

```typescript
spacing.xs    // 4px   - Tight spacing
spacing.sm    // 8px   - Small spacing
spacing.md    // 16px  - Default spacing
spacing.lg    // 24px  - Large spacing
spacing.xl    // 32px  - Extra large
spacing['2xl'] // 48px  - Section spacing
spacing['3xl'] // 64px  - Large sections
spacing['4xl'] // 96px  - Hero sections
spacing['5xl'] // 128px - Massive spacing
```

**Usage:**

```tsx
<div style={{ padding: spacing.lg, margin: spacing.xl }}>
  Content
</div>

{/* Or use Tailwind: */}
<div className="p-6 m-8">
  Content
</div>
```

---

## 🧩 Components

### Buttons

```typescript
// Base class
components.button.base

// Variants
components.button.variants.primary    // Black background
components.button.variants.secondary  // White background
components.button.variants.gradient   // Gradient background
components.button.variants.ghost      // Transparent
components.button.variants.danger     // Red background

// Sizes
components.button.sizes.sm   // Small
components.button.sizes.md   // Medium (default)
components.button.sizes.lg   // Large
components.button.sizes.xl   // Extra large
```

**Example:**

```tsx
import { components } from '@/lib/designSystem';

<button 
  className={`${components.button.base} ${components.button.variants.primary} ${components.button.sizes.md}`}
>
  Click Me
</button>

{/* Or use the Button component: */}
import { Button } from '@/app/components/ui/button';

<Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-full">
  Click Me
</Button>
```

### Inputs

```tsx
import { components } from '@/lib/designSystem';

<input 
  type="email"
  className={`${components.input.base} ${components.input.variants.default}`}
  placeholder="Enter your email"
/>

{/* Error state: */}
<input 
  className={`${components.input.base} ${components.input.variants.error}`}
/>
```

### Cards

```tsx
import { components } from '@/lib/designSystem';

<div className={components.card.base}>
  Card content
</div>

{/* With hover effect: */}
<div className={`${components.card.base} ${components.card.hover}`}>
  Interactive card
</div>

{/* Glassmorphism: */}
<div className={components.card.glass}>
  Glass effect card
</div>
```

---

## ✨ Animations

### Framer Motion Variants

```typescript
import { animations } from '@/lib/designSystem';
import { motion } from 'framer-motion';

<motion.div {...animations.fadeIn}>
  Fade in content
</motion.div>

<motion.div {...animations.slideUp}>
  Slide up content
</motion.div>

<motion.div {...animations.scaleIn}>
  Scale in content
</motion.div>
```

### Available Animations

- `animations.fadeIn` - Simple fade in
- `animations.slideUp` - Slide up with fade
- `animations.slideDown` - Slide down with fade
- `animations.scaleIn` - Scale and fade
- `animations.bounce` - Bounce effect

### Custom Animations

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ 
    duration: parseFloat(animations.duration.normal) / 1000,
    ease: animations.easing.easeOut 
  }}
>
  Custom animation
</motion.div>
```

---

## 🎯 Best Practices

### 1. **Always Import from Design System**

❌ **Don't:**
```tsx
<button style={{ color: '#30C4FF' }}>
  Button
</button>
```

✅ **Do:**
```tsx
import { colors } from '@/lib/designSystem';

<button style={{ color: colors.brand.primary }}>
  Button
</button>
```

### 2. **Use Tailwind Classes When Possible**

Tailwind CSS is already configured with matching values:

```tsx
{/* These are equivalent: */}
<div style={{ padding: spacing.lg }}>Content</div>
<div className="p-6">Content</div>

{/* Use Tailwind for responsive design: */}
<div className="p-4 md:p-6 lg:p-8">
  Responsive padding
</div>
```

### 3. **Consistent Component Structure**

```tsx
import { components, animations } from '@/lib/designSystem';
import { motion } from 'framer-motion';

export default function MyComponent() {
  return (
    <motion.section {...animations.fadeIn} className={components.section.base}>
      <div className={components.container.default}>
        <h1 className="text-4xl font-bold mb-6">Title</h1>
        <p className="text-lg text-gray-700">Content</p>
      </div>
    </motion.section>
  );
}
```

### 4. **Color Accessibility**

Always ensure sufficient contrast:
- Text on white: Use `colors.text.primary` (#1F2937)
- Text on dark: Use `colors.text.inverse` (#FFFFFF)
- Check contrast ratios: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### 5. **Spacing Consistency**

Use the spacing scale for ALL spacing:

```tsx
{/* ❌ Don't: */}
<div className="p-5 m-7">

{/* ✅ Do: */}
<div className="p-6 m-8">  {/* Uses spacing scale */}
```

### 6. **Animation Performance**

- Use `transform` and `opacity` for animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (causes reflows)
- Keep animation durations under 500ms for better UX

```tsx
{/* ✅ Good - GPU accelerated */}
<motion.div
  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
/>

{/* ❌ Avoid - Causes reflows */}
<motion.div
  animate={{ width: '100%', height: 200 }}
/>
```

---

## 🔄 Updating the Design System

When adding new design tokens:

1. **Update** `client/src/lib/designSystem.ts`
2. **Document** the change in this file
3. **Update** existing components to use new tokens
4. **Test** across all breakpoints

---

## 📦 Related Files

- **Design System:** `client/src/lib/designSystem.ts`
- **Tailwind Config:** `tailwind.config.ts`
- **Global Styles:** `client/src/index.css`

---

## 🎨 Design Principles

1. **Consistency** - Use the design system everywhere
2. **Simplicity** - Keep it clean and minimal
3. **Hierarchy** - Clear visual hierarchy guides users
4. **Whitespace** - Don't be afraid of empty space
5. **Accessibility** - Design for everyone
6. **Performance** - Optimize animations and images

---

## 🚀 Quick Reference

```typescript
// Typography
import { typography } from '@/lib/designSystem';
typography.fontFamily.primary
typography.fontSize.xl
typography.fontWeight.bold

// Colors
import { colors } from '@/lib/designSystem';
colors.brand.primary
colors.gradients.primary
colors.neutral.gray

// Components
import { components } from '@/lib/designSystem';
components.button.base
components.input.base
components.card.base

// Animations
import { animations } from '@/lib/designSystem';
<motion.div {...animations.fadeIn}>
```

---

**🎉 Consistent design makes for a better user experience!**

For questions or suggestions, update this document or discuss with the team.

