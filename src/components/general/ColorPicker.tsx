import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  showThemeIndicator?: boolean;
  className?: string;
}

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Blue', theme: 'blue' },
  { value: '#10b981', label: 'Green', theme: 'green' },
  { value: '#8b5cf6', label: 'Purple', theme: 'purple' },
  { value: '#f97316', label: 'Orange', theme: 'orange' },
  { value: '#ec4899', label: 'Pink', theme: 'pink' },
  { value: '#ef4444', label: 'Red', theme: 'red' },
];

export function ColorPicker({ 
  value, 
  onChange, 
  label = "Color", 
  showThemeIndicator = true,
  className = ""
}: ColorPickerProps) {
  const [currentTheme, setCurrentTheme] = useState('blue');

  useEffect(() => {
    const theme = localStorage.getItem('colorTheme') || 'blue';
    setCurrentTheme(theme);
    
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('colorTheme') || 'blue';
      setCurrentTheme(newTheme);
    };
    
    window.addEventListener('colorThemeChanged', handleThemeChange);
    return () => window.removeEventListener('colorThemeChanged', handleThemeChange);
  }, []);

  return (
    <div className={className}>
      <Label className="text-base font-semibold mb-3 block">{label}</Label>
      <div className="grid grid-cols-6 gap-2">
        {COLOR_OPTIONS.map((color) => {
          const isThemeColor = showThemeIndicator && color.theme === currentTheme;
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => onChange(color.value)}
              className={`h-10 w-full rounded-lg border-2 transition-all relative ${
                value === color.value
                  ? 'border-foreground scale-110 shadow-lg'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.label + (isThemeColor ? ' (Theme)' : '')}
            >
              {isThemeColor && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white shadow-lg" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showThemeIndicator && (
        <p className="text-xs text-muted-foreground mt-2">
          Theme color is marked with a dot
        </p>
      )}
    </div>
  );
}

// Utility function to get theme color
export const getThemeColor = () => {
  const theme = localStorage.getItem('colorTheme') || 'blue';
  const colors: { [key: string]: string } = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    orange: '#f97316',
    pink: '#ec4899',
    red: '#ef4444',
  };
  return colors[theme] || '#3b82f6';
};
