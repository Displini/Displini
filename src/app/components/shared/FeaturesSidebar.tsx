import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { X, Moon, Heart, Pill, Droplets, Briefcase, GraduationCap, BookOpen, Dumbbell, BarChart3, Settings, Sun, Bell, Utensils } from "lucide-react";
import { colors } from "@/lib/designSystem";

interface FeaturesSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isClosing?: boolean;
  onStatsClick?: () => void;
  onSettingsClick?: () => void;
  onFeatureClick?: (feature: string) => void;
}

// Features ordered to match landing page carousel (Section 3)
// Order: Sleep, Water, Medication, Menstrual, Sport, Journal, Office, School
const features = [
  {
    id: 'sleep',
    name: 'Sleep Schedule',
    icon: Moon,
    color: colors.features.sleep
  },
  {
    id: 'water',
    name: 'Water Intake',
    icon: Droplets,
    color: colors.features.water
  },
  {
    id: 'medication',
    name: 'Medication',
    icon: Pill,
    color: colors.features.medication
  },
  {
    id: 'food',
    name: 'Food Tracker',
    icon: Utensils,
    color: colors.features.food || '#f59e0b'
  },
  {
    id: 'menstrual',
    name: 'Menstrual Cycle',
    icon: Heart,
    color: colors.features.menstrual
  },
  {
    id: 'sport',
    name: 'Sport',
    icon: Dumbbell,
    color: colors.features.sport
  },
  {
    id: 'journal',
    name: 'Journal',
    icon: BookOpen,
    color: colors.features.journal
  },
  {
    id: 'work',
    name: 'Office',
    icon: Briefcase,
    color: colors.features.office
  },
  {
    id: 'school',
    name: 'School',
    icon: GraduationCap,
    color: colors.features.school
  }
];

export function FeaturesSidebar({ 
  isOpen, 
  onClose, 
  isClosing = false,
  onStatsClick,
  onSettingsClick,
  onFeatureClick
}: FeaturesSidebarProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleFeatureClick = (featureId: string) => {
    // Dispatch event for centralized feature dialog handler
    window.dispatchEvent(new CustomEvent('openFeature', { detail: { featureId } }));
    if (onFeatureClick) {
      onFeatureClick(featureId);
    }
    onClose();
  };

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300" 
      style={{ opacity: isClosing ? 0 : 1 }} 
      onClick={onClose}
    >
      <div 
        className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 rounded-tl-3xl rounded-bl-3xl overflow-hidden" 
        style={{ 
          transform: isClosing ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          animation: isOpen && !isClosing ? 'slideInFromRight 0.3s ease-out' : undefined
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Features</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Features List */}
          <div className="space-y-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={feature.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-all rounded-full" 
                  onClick={() => handleFeatureClick(feature.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: feature.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{feature.name}</h3>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          
          {/* Settings, Stats, and Dark Mode Icons */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-around">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onStatsClick) onStatsClick();
                  onClose();
                }}
                title="Statistics"
              >
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onSettingsClick) onSettingsClick();
                  onClose();
                }}
                title="Settings"
              >
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleDarkMode}
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </Button>
            </div>
          </div>
          
          {/* App Version & Social Links */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="text-xs text-muted-foreground text-center mb-3">
              <p className="font-medium">App Version</p>
              <p className="mt-1">v1.0.0</p>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="GitHub">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Twitter">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475 4.911 4.911 0 002.188 4.09 4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="LinkedIn">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
