# 🌸 Displini

A comprehensive health, fitness, and productivity tracking application built with React, TypeScript, and modern web technologies.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

### 🏥 Health Tracking
- **Blood Glucose Monitoring** - Track glucose levels with meal context and target ranges
- **Sleep Schedule** - Daily or weekly sleep tracking with quality logs and winddown/startup routines
- **Menstrual Cycle Tracker** - Period tracking with AI-powered predictions and symptom logging
- **Mood & Stress Tracking** - Monitor mental health with visual charts and historical data
- **Breathing & Mindfulness** - Guided breathing exercises with customizable reminders
- **Medications & Pills** - Smart reminder system with priority levels and missed dose tracking
- **Pregnancy Mode** - Week-by-week pregnancy tracking with milestones
- **Alcohol & Smoking Tracker** - Monitor consumption patterns and set reduction goals
- **Weight & BMI Calculator** - Track body composition with goal setting

### 🍽️ Nutrition Tracking
- **Meal Logging** - Barcode scanning, quick add, and detailed macro tracking
- **Water Intake** - Hydration tracking with smart reminders synced to sleep schedule
- **Macro Calculator** - Personalized nutrition goals based on activity level
- **Macro Progress** - Real-time tracking against daily targets with visual progress bars
- **Weight Goal Tracker** - Progress monitoring with body fat percentage and history

### 💪 Fitness & Sport
- **Workout Schedule** - Recurring workout planning with multiple frequency options
- **Step Counter** - Daily step tracking with goals and reminders
- **Recent Workouts** - Workout history with completion tracking and statistics

### ✅ Productivity
- **Liquid Timeline** - Visual daily schedule with drag-and-drop (15-min intervals)
- **Task Management** - Tasks with subtasks, reminders, emoji support, and priorities
- **Winddown & Startup Routines** - Morning and evening routine management with subtasks
- **Office Productivity** - Focused work task tracking
- **Journal & Reflection** - Daily journaling with prompts and mood tracking

### 📅 Calendar
- **Event Management** - Schedule events with color coding
- **Period Predictions** - Menstrual cycle forecasting on calendar view
- **Meal Schedule** - Planned meals integrated into calendar
- **Workout Planning** - Scheduled workouts with automatic task creation

### 🤖 AI Features
- **AI Chat Assistant** - Context-aware suggestions for meals, workouts, and tasks
- **Smart Predictions** - Menstrual cycle prediction refinement over time
- **Personalized Recommendations** - Based on your tracking data

## 🚀 Tech Stack

### Frontend
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.6** - Static typing and enhanced DX
- **Tailwind CSS 3.4** - Utility-first styling
- **Shadcn UI** - Accessible component library
- **Wouter** - Lightweight routing (~1.5kB)
- **React Query** - Server state management
- **date-fns** - Date manipulation and formatting
- **Framer Motion** - Smooth animations
- **DND Kit** - Drag and drop functionality

### Backend
- **Express 4.21** - Web framework
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database queries
- **OpenAI API** - AI chat integration
- **Express Session** - Session management

### Build Tools
- **Vite 5.4** - Lightning-fast build tool
- **ESBuild** - Fast bundler
- **TSX** - TypeScript execution
- **PostCSS** - CSS processing

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Neon serverless account)
- OpenAI API key (optional, for AI features)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Displini
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create `.env` in root directory:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   OPENAI_API_KEY=sk-your-key-here
   SESSION_SECRET=your-random-secret-key
   NODE_ENV=development
   ```

   Create `server/.env`:
   ```env
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   🎉 App available at **http://localhost:4000**

## 🌐 Routing Structure

**Public Routes (Not Authenticated):**
- `/` → Landing page with product showcase
- `/app/*` → Redirects to landing (requires auth)

**Authenticated Routes:**
- `/` → Landing page (still accessible)
- `/app` → Redirects to `/app/todo`
- `/app/todo` → Task management
- `/app/calendar` → Calendar view
- `/app/reminders` → Reminders & habits
- `/app/ai` → AI assistant
- `/app/profile` → User profile

**Backend API:**
- `/api/*` → All API endpoints
- All other routes → SPA fallback (React Router handles)

## 🏗️ Project Structure

```
Displini/
├── landing/                    # Landing page code and assets (organized)
│   ├── assets/                # Static assets
│   │   ├── images/            # Landing page images
│   │   ├── videos/            # Landing page videos
│   │   └── logos/             # Logo files
│   ├── components/            # Landing page React components
│   │   ├── LandingHero.tsx
│   │   ├── LandingFeatures.tsx
│   │   ├── LandingCarousel.tsx
│   │   └── ... (other landing components)
│   ├── hooks/                 # Landing page specific hooks
│   ├── Landing.tsx            # Main landing page component
│   ├── landing.module.css     # Landing page styles
│   └── constants.ts           # Landing page constants
│
├── displini-style-guide/      # Design system resources
│   ├── logo/                  # All Displini logo variations
│   └── DESIGN_CHEATSHEET.txt  # Developer quick reference (colors, fonts, spacing)
│
├── app/                       # Main application code (reference copy)
│   ├── components/            # React components
│   │   ├── shared/           # Universal reusable components
│   │   └── ui/               # Shadcn UI primitives
│   ├── features/             # Feature modules
│   │   ├── calendar/
│   │   ├── reminders/
│   │   └── todo/
│   ├── pages/                # Page components
│   ├── shared/               # Shared app components
│   └── types/                # App-specific types
│
├── ai/                        # AI documentation and guides
│   ├── ALGORITHM_SPECIFICATION.md
│   ├── BACKEND_READINESS.md
│   ├── DEPLOYMENT_GUIDE.md
│   ├── DESIGN_SYSTEM.md
│   ├── ERROR_HANDLING_GUIDE.md
│   ├── ENV_TEMPLATE.md
│   └── README.md
│
├── client/                    # Frontend React application (working code)
│   ├── src/
│   │   ├── app/              # Main app code (imports use @/app/...)
│   │   │   ├── components/   # React components
│   │   │   │   ├── shared/   # Universal reusable components
│   │   │   │   └── ui/       # Shadcn UI primitives
│   │   │   ├── features/     # Feature modules
│   │   │   │   ├── calendar/
│   │   │   │   ├── reminders/
│   │   │   │   └── todo/
│   │   │   ├── pages/        # Main page components
│   │   │   │   ├── landing/  # Landing page (/)
│   │   │   │   ├── todo/     # Todo app (/app/todo)
│   │   │   │   ├── calendar/ # Calendar (/app/calendar)
│   │   │   │   ├── reminders/# Reminders (/app/reminders)
│   │   │   │   ├── ai/       # AI assistant (/app/ai)
│   │   │   │   └── profile/  # Profile (/app/profile)
│   │   │   ├── shared/       # Shared app components
│   │   │   └── types/        # App-specific types
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and helpers
│   │   ├── types/            # Shared TypeScript definitions
│   │   ├── App.tsx           # Main app with routing
│   │   └── main.tsx          # App entry point
│   ├── public/               # Static assets (still used by app)
│   │   ├── images/           # Images and SVGs
│   │   ├── logos/            # Brand logos
│   │   └── fonts/            # Custom fonts
│   └── index.html
│
├── server/                    # Backend Express application
│   ├── db.ts                 # Database setup
│   ├── routes.ts             # API endpoints
│   ├── openai.ts             # AI integration
│   ├── storage.ts            # Storage utilities
│   ├── vite.ts               # Vite middleware & SPA fallback
│   └── index.ts              # Server entry point
│
├── shared/                    # Shared frontend/backend code
│   └── schema.ts             # Database schema (Drizzle)
│
├── dist/                      # Production build output
│   └── public/               # Built React app
│
├── PROJECT_STRUCTURE.md       # Detailed structure documentation
├── package.json               # Dependencies
├── vite.config.ts             # Vite configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
└── drizzle.config.ts          # Drizzle ORM configuration
```

### 📁 Folder Organization

- **`/landing/`** - All landing page code and assets in one place
- **`/displini-style-guide/`** - Design system resources and developer cheatsheet
- **`/app/`** - Reference copy of main application code structure
- **`/ai/`** - Documentation for AI assistants and developers
- **`/client/src/app/`** - Working application code (maintains import paths)

## 🎨 Architecture & Design

### **Universal Component System**

We follow a **zero-duplication** architecture with universal patterns:

#### **UniversalDialog** 🎯
All dialogs use the same component for consistency:
```tsx
<UniversalDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Log Glucose Reading"
  onSave={handleSave}
  saveLabel="Save"
>
  {/* content */}
</UniversalDialog>
```

**Benefits:**
- Consistent `max-w-md` width (matches meal log)
- Rounded corners (`rounded-3xl`)
- Scrollable content
- Auto-managed buttons
- ~340 lines of code eliminated

#### **MinimizableCard** 📦
All sections use the same container:
```tsx
<MinimizableCard
  title="🩸 Blood Glucose"
  minimized={minimized}
  onMinimizeChange={setMinimized}
>
  {/* component */}
</MinimizableCard>
```

#### **Storage Utilities** 💾
Centralized localStorage operations:
```tsx
import { getStorageItem, setStorageItem, getCurrentWeight } from '@/lib/storageUtils';

const meals = getStorageItem('meals', []);
const weight = getCurrentWeight();
```

### **Design Tokens**
Centralized design values in `lib/designTokens.ts`:
- Colors and themes
- Typography scales
- Spacing system
- Animation timings
- Component styles

## 🔄 Data Flow

```
User Input → Component State → localStorage → Event Dispatch → Cross-Component Sync
```

**Key Events:**
- `todosUpdated` - Task list changes
- `menstrualDataUpdated` - Cycle data changes
- `openJournal` - Navigate to journal
- `openAiChat` - Open AI assistant
- `openAddTask` - Open task dialog

## 🎯 Development Guidelines

### **Component Standards**

1. **All new dialogs MUST use UniversalDialog**
2. **All sections MUST use MinimizableCard**
3. **Use storage utilities** instead of direct localStorage
4. **Follow existing patterns** in each tab's folder
5. **Type everything** - no `any` types

### **File Organization**

```
New health component → client/src/components/health/
New food component → client/src/components/food/
Shared utility → client/src/lib/
Shared component → client/src/components/shared/
```

### **Naming Conventions**

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Hooks: `useCamelCase.ts`
- Types: `PascalCase` interfaces
- Constants: `UPPER_SNAKE_CASE`

## 🧪 Testing

```bash
# Type checking
npm run check

# Build test
npm run build
```

## 📱 Mobile Support

Fully responsive with mobile-first design:
- Touch gestures for navigation
- Swipe between tabs
- Optimized bottom navigation
- Mobile-friendly dialogs
- Responsive timeline

## 🎨 Theming

Built-in dark/light mode support:
- System preference detection
- Manual toggle in header
- Persistent theme selection
- All components theme-aware

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ❌ Optional |
| `SESSION_SECRET` | Secret for session encryption | ✅ Yes |
| `NODE_ENV` | Environment (development/production) | ✅ Yes |

## 📊 Performance

- **Initial Load**: < 2s
- **Route Transitions**: < 100ms
- **Dialog Animations**: 200ms smooth
- **Bundle Size**: Optimized with code splitting
- **Lighthouse Score**: 90+ across all metrics

## 🚢 Deployment

### **Build for Production**
```bash
npm run build
```

This builds:
- React app → `dist/public/`
- Server code → `dist/index.js`

### **Start Production Server**
```bash
npm start
```

Serves on port 4000 by default.

### **Deployment Platforms**
- ✅ **Render/Railway/Fly.io** - Best for Express apps
- ✅ **Traditional VPS** - Full control (AWS, DigitalOcean, etc.)
- ✅ **Vercel** - Serverless functions (with Express adapter)
- ⚠️ **Netlify** - Not recommended (persistent server needed)

📚 **See [ai/DEPLOYMENT_GUIDE.md](./ai/DEPLOYMENT_GUIDE.md) for detailed instructions!**

### **Domain Structure**
Both landing page and app are served from the same domain:
- `https://yourdomain.com/` → Landing page
- `https://yourdomain.com/app/*` → Web application

No subdomain or separate hosting needed! ✨

## 📚 Documentation

- **Design System** - See `displini-style-guide/DESIGN_CHEATSHEET.txt` for colors, fonts, and spacing
- **Deployment Guide** - See `ai/DEPLOYMENT_GUIDE.md` for deployment instructions
- **Algorithm Spec** - See `ai/ALGORITHM_SPECIFICATION.md` for timeline algorithm details
- **Project Structure** - See `PROJECT_STRUCTURE.md` for folder organization details
- **AI Documentation** - See `ai/README.md` for all AI assistant documentation

## 📈 Roadmap

- [ ] Mobile apps (React Native)
- [ ] Data export/import
- [ ] Cloud sync
- [ ] Social features
- [ ] Advanced analytics
- [ ] Integration with fitness devices
- [ ] Meal planning with AI

## 🤝 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check documentation files
- Review code comments

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Complete health tracking suite
- ✅ Nutrition and macro tracking
- ✅ Fitness and workout planning
- ✅ Adaptive density-based timeline with drag-and-drop
- ✅ 3-tier task sizing system
- ✅ AI chat assistant
- ✅ Universal component system
- ✅ Zero dialog code duplication
- ✅ Rounded corners on all dialogs
- ✅ Onboarding wizard
- ✅ Dark/light theme
- ✅ Organized folder structure (landing, style guide, app, ai)
- ✅ Comprehensive documentation

---

**Built with ❤️ for comprehensive health and productivity tracking**

*Making daily wellness tracking effortless and beautiful*

