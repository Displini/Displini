import { Bell, CheckSquare, Calendar, Sparkles } from "lucide-react";
import { Heart, Moon, Droplet, Dumbbell, Briefcase, BookOpen, Pill, GraduationCap } from "lucide-react";
import { colors } from "@/lib/designSystem";

// Feature showcase constants
export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const FEATURES: Feature[] = [
  {
    id: 'reminders',
    title: 'Reminders',
    description: `Have ideas, tasks, or notes that don't yet fit your schedule?

Write them down in Reminders, your flexible inbox for everything you want to remember.`,
    icon: Bell,
    color: colors.features.reminders
  },
  {
    id: 'todo',
    title: 'To-Do',
    description: `Keep track of tasks in an intuitive timeline that flows like your day.

Plan your time into focused blocks and mark each one complete as you go.`,
    icon: CheckSquare,
    color: colors.features.todo
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: `Easily manage appointments, meetings and events in one connected calendar.

Never forget a birthday or a call and let Displini's AI automatically add important tasks from your emails.`,
    icon: Calendar,
    color: colors.features.calendar
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: `With Displini AI, you can plan, reschedule and structure your entire day in seconds.

The assistant helps you stay balanced from optimizing focus time to rearranging your timeline automatically.`,
    icon: Sparkles,
    color: colors.features.ai
  }
];

// Carousel constants
export interface CarouselFeature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

export const CAROUSEL_FEATURES: CarouselFeature[] = [
  {
    title: "Sleep Schedule",
    description: "Schedule your sleep routine with gentle reminders for wind-down activities.",
    icon: Moon,
    color: colors.features.sleep
  },
  {
    title: "Water Intake",
    description: "Set daily goals, track every glass and celebrate your streaks.",
    icon: Droplet,
    color: colors.features.water
  },
  {
    title: "Medication",
    description: "Track daily medication and supplements with gentle reminders.",
    icon: Pill,
    color: colors.features.medication
  },
  {
    title: "Menstrual Cycle",
    description: "Track your cycle with gentle reminders. Understand your body's rhythm and plan accordingly.",
    icon: Heart,
    color: colors.features.menstrual
  },
  {
    title: "Sport",
    description: "Track workouts, log reps and weights, map your running routes.",
    icon: Dumbbell,
    color: colors.features.sport
  },
  {
    title: "Journal",
    description: "Reflect and unwind. Let AI help you summarize your day.",
    icon: BookOpen,
    color: colors.features.journal
  },
  {
    title: "Office",
    description: "Organize your work life with deadlines, paydays, and tasks directly in your calendar.",
    icon: Briefcase,
    color: colors.features.office
  },
  {
    title: "School",
    description: "Organize your study life with class times, assignments, and exam schedules.",
    icon: GraduationCap,
    color: colors.features.school
  }
];

// Magic numbers as constants
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

export const TIMELINE = {
  WAKE_UP: '06:00',
  BEDTIME: '23:30',
} as const;

export const CAROUSEL = {
  TOTAL_COPIES: 50,
  CARD_WIDTH_DESKTOP: 400,
  CARD_WIDTH_MOBILE: 280,
  CARD_GAP: 24,
} as const;

export const SCROLL = {
  THRESHOLD: 30,
  COOLDOWN: 600,
  SNAP_DELAY: 500,
  FALLBACK_TIMEOUT: 1500,
} as const;

export const ANIMATION = {
  TYPING_SPEED: 15,
  BREATHE_DURATION: 2000,
  FADE_DURATION: 600,
} as const;

