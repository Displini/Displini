import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  ChevronRight, 
  Palette, 
  Globe, 
  Sparkles, 
  ListTodo, 
  Calendar as CalendarIcon, 
  HelpCircle, 
  Info,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  User,
  Edit,
  Moon,
  Bell
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Separator } from "@/app/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/app/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const themes = [
  { id: "blue", name: "Blue", primary: "59 91% 47%", primaryDark: "210 100% 60%" },
  { id: "green", name: "Green", primary: "142 71% 45%", primaryDark: "142 71% 55%" },
  { id: "purple", name: "Purple", primary: "271 81% 56%", primaryDark: "271 81% 66%" },
  { id: "orange", name: "Orange", primary: "24 80% 58%", primaryDark: "24 80% 68%" },
  { id: "pink", name: "Pink", primary: "330 81% 60%", primaryDark: "330 81% 70%" },
  { id: "custom", name: "Custom", primary: "", primaryDark: "" },
];

type Section = 'main' | 'profile' | 'general' | 'reminders' | 'sleep' | 'fun' | 'styling' | 'todo' | 'calendar' | 'support' | 'about';

interface SettingsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Settings({ open, onOpenChange }: SettingsProps) {
  const [selectedTheme, setSelectedTheme] = useState("blue");
  const [customColor, setCustomColor] = useState("#3b82f6");
  const [weekStartDay, setWeekStartDay] = useState("0");
  const [temperatureUnit, setTemperatureUnit] = useState("celsius");
  const [measurementUnit, setMeasurementUnit] = useState("metric");
  const [timezone, setTimezone] = useState("auto");
  const [showTaskTags, setShowTaskTags] = useState(true);
  const [confettiEnabled, setConfettiEnabled] = useState(true);
  const [showTodosInCalendar, setShowTodosInCalendar] = useState(false);
  const [stickyDateCarousel, setStickyDateCarousel] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [quoteEnabled, setQuoteEnabled] = useState(() => {
    const saved = localStorage.getItem('quote_settings');
    return saved ? JSON.parse(saved).enabled : false;
  });
  const [affirmationEnabled, setAffirmationEnabled] = useState(() => {
    const saved = localStorage.getItem('affirmation_settings');
    return saved ? JSON.parse(saved).enabled : false;
  });
  const [currentSection, setCurrentSection] = useState<Section>('main');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [language, setLanguage] = useState("en");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleEditProfile = () => {
    const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    profile.onboardingCompleted = false;
    localStorage.setItem('userProfile', JSON.stringify(profile));
    window.location.reload();
  };

  const handleSectionChange = (section: Section) => {
    if (section === currentSection || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSection(section);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150); // Half of the animation duration
    }, 150);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("colorTheme") || "blue";
    const savedCustomColor = localStorage.getItem("customColor") || "#3b82f6";
    const savedWeekStart = localStorage.getItem("weekStartDay") || "0";
    const savedTempUnit = localStorage.getItem("temperatureUnit") || "celsius";
    const savedMeasureUnit = localStorage.getItem("measurementUnit") || "metric";
    const savedTimezone = localStorage.getItem("timezone") || "auto";
    const savedShowTags = localStorage.getItem("showTaskTags") !== "false";
    const savedConfetti = localStorage.getItem("confettiEnabled") !== "false";
    const savedShowTodosInCalendar = localStorage.getItem("showTodosInCalendar") === "true";
    const savedStickyCarousel = localStorage.getItem("stickyDateCarousel") === "true";
    const savedAutoScroll = localStorage.getItem("autoScrollEnabled") !== "false";
    const savedDOB = localStorage.getItem('userDateOfBirth') || "";
    const savedLanguage = localStorage.getItem("language") || "en";
    setSelectedTheme(savedTheme);
    setCustomColor(savedCustomColor);
    setWeekStartDay(savedWeekStart);
    setTemperatureUnit(savedTempUnit);
    setMeasurementUnit(savedMeasureUnit);
    setTimezone(savedTimezone);
    setShowTaskTags(savedShowTags);
    setConfettiEnabled(savedConfetti);
    setShowTodosInCalendar(savedShowTodosInCalendar);
    setStickyDateCarousel(savedStickyCarousel);
    setAutoScrollEnabled(savedAutoScroll);
    setDateOfBirth(savedDOB);
    setLanguage(savedLanguage);
    applyTheme(savedTheme, savedCustomColor);
  }, []);

  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "210 100% 60%";

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  const applyTheme = (themeId: string, color?: string) => {
    const theme = themes.find((t) => t.id === themeId);
    const root = document.documentElement;
    
    let primaryColor = theme?.primary || "";
    let primaryDarkColor = theme?.primaryDark || "";

    if (themeId === "custom" && color) {
      const hsl = hexToHSL(color);
      primaryColor = hsl;
      const [h, s, l] = hsl.split(" ");
      const lightness = parseInt(l);
      primaryDarkColor = `${h} ${s} ${Math.min(lightness + 10, 90)}%`;
    }

    if (primaryColor) {
      root.style.setProperty("--primary", primaryColor);
      root.style.setProperty("--sidebar-primary", primaryColor);
      root.style.setProperty("--ring", primaryColor);
      root.style.setProperty("--sidebar-ring", primaryColor);
      
      if (document.documentElement.classList.contains("dark")) {
        root.style.setProperty("--primary", primaryDarkColor);
        root.style.setProperty("--sidebar-primary", primaryDarkColor);
        root.style.setProperty("--ring", primaryDarkColor);
        root.style.setProperty("--sidebar-ring", primaryDarkColor);
      }
    }
  };

  const handleThemeChange = (themeId: string) => {
    setSelectedTheme(themeId);
    localStorage.setItem("colorTheme", themeId);
    applyTheme(themeId, customColor);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    localStorage.setItem("customColor", color);
    if (selectedTheme === "custom") {
      applyTheme("custom", color);
    }
  };

  const handleWeekStartChange = (day: string) => {
    setWeekStartDay(day);
    localStorage.setItem("weekStartDay", day);
    window.dispatchEvent(new Event('weekStartDayChanged'));
  };

  const handleTemperatureUnitChange = (unit: string) => {
    setTemperatureUnit(unit);
    localStorage.setItem("temperatureUnit", unit);
  };

  const handleMeasurementUnitChange = (unit: string) => {
    setMeasurementUnit(unit);
    localStorage.setItem("measurementUnit", unit);
  };

  const handleTimezoneChange = (tz: string) => {
    setTimezone(tz);
    localStorage.setItem("timezone", tz);
    window.dispatchEvent(new Event('timezoneChanged'));
  };

  const handleShowTaskTagsChange = (checked: boolean) => {
    setShowTaskTags(checked);
    localStorage.setItem("showTaskTags", String(checked));
    window.dispatchEvent(new Event('taskTagsSettingChanged'));
  };

  const handleConfettiChange = (checked: boolean) => {
    setConfettiEnabled(checked);
    localStorage.setItem("confettiEnabled", String(checked));
  };

  const handleShowTodosInCalendarChange = (checked: boolean) => {
    setShowTodosInCalendar(checked);
    localStorage.setItem("showTodosInCalendar", String(checked));
    window.dispatchEvent(new Event('calendarTodosSettingChanged'));
  };

  const handleStickyCarouselChange = (checked: boolean) => {
    setStickyDateCarousel(checked);
    localStorage.setItem("stickyDateCarousel", String(checked));
    window.dispatchEvent(new Event('stickyCarouselSettingChanged'));
  };

  const handleAutoScrollChange = (checked: boolean) => {
    setAutoScrollEnabled(checked);
    localStorage.setItem("autoScrollEnabled", String(checked));
  };

  // Removed Work/School header toggles; these are accessible as features now

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
    toast({
      title: "Language updated",
      description: "Your language preference has been saved.",
    });
  };

  const handleResetApp = () => {
    if (confirm("Are you sure you want to reset all app data? This cannot be undone.")) {
      // Clear all localStorage except authentication
      const keysToKeep = ['auth_token', 'user'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      });
      toast({
        title: "App reset",
        description: "All data has been cleared. Refreshing...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const initials = user 
    ? user.email?.[0]?.toUpperCase() || '?'
    : '?';

  const sections = [
    { id: 'general' as Section, label: 'General', icon: Globe, description: 'Notifications, customization & preferences' },
    { id: 'reminders' as Section, label: 'Reminders', icon: Bell, description: 'Reminder settings & integrations' },
    { id: 'sleep' as Section, label: 'Sleep Schedule', icon: Moon, description: 'Wind down & start up routines' },
    { id: 'fun' as Section, label: 'Fun', icon: Sparkles, description: 'Quotes, affirmations & celebrations' },
    { id: 'styling' as Section, label: 'Styling', icon: Palette, description: 'Colors, theme & appearance' },
    { id: 'todo' as Section, label: 'To-Do', icon: ListTodo, description: 'Task display options' },
    { id: 'calendar' as Section, label: 'Calendar', icon: CalendarIcon, description: 'Calendar view settings' },
    { id: 'support' as Section, label: 'Support', icon: HelpCircle, description: 'Help & feedback' },
    { id: 'about' as Section, label: 'About', icon: Info, description: 'Privacy, terms & info' },
  ];

  const renderMainMenu = () => (
    <div className="space-y-3">
      {user && (
        <>
          <Button 
            variant="outline" 
            className={`w-full justify-start gap-3 h-auto py-3 transition-all duration-200 ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
            onClick={() => handleSectionChange('profile')}
            disabled={isTransitioning}
          >
            <Avatar className="w-10 h-10">
              <AvatarImage src={undefined} alt={user.email || 'User'} className="object-cover" />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start flex-1">
              <span className="font-medium">{user.email || 'User'}</span>
              <span className="text-xs text-muted-foreground">Edit profile & personal info</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Separator className="my-4" />
        </>
      )}

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <Button
            key={section.id}
            variant="ghost"
            className={`w-full justify-between h-auto py-3 px-4 transition-all duration-200 ${
              isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
            }`}
            onClick={() => handleSectionChange(section.id)}
            disabled={isTransitioning}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-primary" />
              <div className="flex flex-col items-start">
                <span className="font-medium">{section.label}</span>
                <span className="text-xs text-muted-foreground">{section.description}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        );
      })}
      
      <Separator className="my-4" />
      
      {/* Social Media Icons */}
      <div className="pt-2">
        <p className="text-xs text-muted-foreground text-center mb-3">Follow us</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href="https://instagram.com/displini" target="_blank" rel="noopener noreferrer" title="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href="https://tiktok.com/@displini" target="_blank" rel="noopener noreferrer" title="TikTok">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href="https://x.com/displini" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
              <Twitter className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href="https://youtube.com/@displini" target="_blank" rel="noopener noreferrer" title="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <a href="https://linkedin.com/company/displini" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Version 1.0.0
        </p>
      </div>
    </div>
  );

  const renderGeneralSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div>
        <Label className="text-base font-semibold mb-3 block">Week Starts On</Label>
        <Select value={weekStartDay} onValueChange={handleWeekStartChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Sunday</SelectItem>
            <SelectItem value="1">Monday</SelectItem>
            <SelectItem value="2">Tuesday</SelectItem>
            <SelectItem value="3">Wednesday</SelectItem>
            <SelectItem value="4">Thursday</SelectItem>
            <SelectItem value="5">Friday</SelectItem>
            <SelectItem value="6">Saturday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Temperature Unit</Label>
        <Select value={temperatureUnit} onValueChange={handleTemperatureUnitChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="celsius">Celsius (°C)</SelectItem>
            <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Measurement System</Label>
        <Select value={measurementUnit} onValueChange={handleMeasurementUnitChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="metric">Metric (cm, kg)</SelectItem>
            <SelectItem value="imperial">Imperial (ft, lb)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Timezone</Label>
        <Select value={timezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="auto">Auto-detect</SelectItem>
            <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
            <SelectItem value="America/New_York">Eastern Time (GMT-5)</SelectItem>
            <SelectItem value="America/Chicago">Central Time (GMT-6)</SelectItem>
            <SelectItem value="America/Denver">Mountain Time (GMT-7)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific Time (GMT-8)</SelectItem>
            <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
            <SelectItem value="Europe/Paris">Paris/Berlin (GMT+1)</SelectItem>
            <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
            <SelectItem value="Asia/Tokyo">Tokyo (GMT+9)</SelectItem>
            <SelectItem value="Australia/Sydney">Sydney (GMT+10)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Date Carousel</Label>
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
          <div>
            <Label className="cursor-pointer">Pin to top (Sticky)</Label>
            <p className="text-xs text-muted-foreground mt-1">Keep date selector visible when scrolling</p>
          </div>
          <Switch
            checked={stickyDateCarousel}
            onCheckedChange={handleStickyCarouselChange}
          />
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Language</Label>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español (Spanish)</SelectItem>
            <SelectItem value="fr">Français (French)</SelectItem>
            <SelectItem value="de">Deutsch (German)</SelectItem>
            <SelectItem value="it">Italiano (Italian)</SelectItem>
            <SelectItem value="pt">Português (Portuguese)</SelectItem>
            <SelectItem value="nl">Nederlands (Dutch)</SelectItem>
            <SelectItem value="ar">العربية (Arabic)</SelectItem>
            <SelectItem value="zh">中文 (Chinese)</SelectItem>
            <SelectItem value="ja">日本語 (Japanese)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block text-destructive">Danger Zone</Label>
        <Button 
          variant="destructive" 
          className="w-full"
          onClick={handleResetApp}
        >
          Reset App Data
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Clear all tasks, settings, and data. This cannot be undone.
        </p>
      </div>
    </div>
  );

  const renderFunSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Quote of the Day</Label>
          <p className="text-xs text-muted-foreground mt-1">Daily inspirational quotes</p>
        </div>
        <Switch
          checked={quoteEnabled}
          onCheckedChange={(checked) => {
            setQuoteEnabled(checked);
            const settings = { enabled: checked };
            localStorage.setItem('quote_settings', JSON.stringify(settings));
            window.dispatchEvent(new Event('quoteSettingsChanged'));
          }}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Daily Affirmations</Label>
          <p className="text-xs text-muted-foreground mt-1">Motivational messages on timeline</p>
        </div>
        <Switch
          checked={affirmationEnabled}
          onCheckedChange={(checked) => {
            setAffirmationEnabled(checked);
            const current = localStorage.getItem('affirmation_settings');
            const settings = current ? JSON.parse(current) : {};
            settings.enabled = checked;
            if (checked) settings.showOnTimeline = true;
            localStorage.setItem('affirmation_settings', JSON.stringify(settings));
            window.dispatchEvent(new Event('affirmationSettingsChanged'));
          }}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Confetti Effect</Label>
          <p className="text-xs text-muted-foreground mt-1">Celebrate when all tasks are done</p>
        </div>
        <Switch
          checked={confettiEnabled}
          onCheckedChange={handleConfettiChange}
        />
      </div>
    </div>
  );

  const renderStylingSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div>
        <Label className="text-base font-semibold mb-4 block">Color Theme</Label>
        <div className="grid grid-cols-3 gap-4">
          {themes.filter(t => t.id !== 'custom').map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedTheme === theme.id 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div
                className="w-12 h-12 rounded-full shadow-md ring-2 ring-background"
                style={{ backgroundColor: `hsl(${theme.primary})` }}
              />
              <span className="text-xs font-medium">{theme.name}</span>
            </button>
          ))}
          
          {/* Custom Color in Grid */}
          <button
            onClick={() => handleThemeChange('custom')}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all hover:scale-105 ${
              selectedTheme === 'custom'
                ? 'border-primary bg-primary/5' 
                : 'border-dashed border-border hover:border-primary/50'
            }`}
            style={{
              borderStyle: selectedTheme === 'custom' ? 'solid' : 'dashed',
            }}
          >
            <div className="relative">
              <Input
                type="color"
                value={customColor}
                onChange={(e) => {
                  e.stopPropagation();
                  handleCustomColorChange(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-12 h-12 rounded-full border-2 border-background cursor-pointer p-0 shadow-md"
                style={{
                  background: customColor,
                }}
              />
            </div>
            <span className="text-xs font-medium">Custom</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRemindersSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Reminders</h2>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Manage your reminders and connect external task services.
        </p>

        <Button 
          className="w-full" 
          onClick={() => {
            window.location.href = '/app/reminders';
            onOpenChange?.(false);
          }}
        >
          <Bell className="w-4 h-4 mr-2" />
          Open Reminders
        </Button>
      </div>
    </div>
  );

  const renderTodoSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Show Task Source Tags</Label>
          <p className="text-xs text-muted-foreground mt-1">Display badges showing where tasks came from</p>
        </div>
        <Switch
          checked={showTaskTags}
          onCheckedChange={handleShowTaskTagsChange}
        />
      </div>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Auto-scroll to Current Time</Label>
          <p className="text-xs text-muted-foreground mt-1">Automatically scroll to current time when opening To-Do page</p>
        </div>
        <Switch
          checked={autoScrollEnabled}
          onCheckedChange={handleAutoScrollChange}
        />
      </div>

      {/* Work/School header toggles removed; features are opened from side menu */}
    </div>
  );

  const renderCalendarSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
        <div>
          <Label className="cursor-pointer font-medium">Show To-Do Tasks in Calendar</Label>
          <p className="text-xs text-muted-foreground mt-1">Display your tasks on the calendar view</p>
        </div>
        <Switch
          checked={showTodosInCalendar}
          onCheckedChange={handleShowTodosInCalendarChange}
        />
      </div>
    </div>
  );

  const renderSupportSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="mailto:support@displini.com">
            <HelpCircle className="w-4 h-4 mr-2" />
            Contact Support
          </a>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="https://forms.gle/displini-feedback" target="_blank" rel="noopener noreferrer">
            <Sparkles className="w-4 h-4 mr-2" />
            Send Feedback
          </a>
        </Button>
      </div>
    </div>
  );

  const renderSleepSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Sleep Schedule</h2>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Manage your wind down and start up routines for better sleep quality.
        </p>

        <Button 
          className="w-full" 
          onClick={() => {
            // Dispatch event to open sleep schedule feature
            window.dispatchEvent(new CustomEvent('openSleepSchedule'));
            onOpenChange?.(false);
          }}
        >
          <Moon className="w-4 h-4 mr-2" />
          Open Sleep Schedule
        </Button>
      </div>
    </div>
  );

  const renderProfileSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="flex flex-col items-center gap-4 p-6 rounded-lg border bg-muted/20">
        <Avatar className="w-20 h-20">
          <AvatarImage src={undefined} alt={user?.email || 'User'} />
          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h2 className="text-lg font-semibold">{user?.email || 'User'}</h2>
          <p className="text-xs text-muted-foreground mt-1">Account Information</p>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Personal Information</Label>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={user?.email || ''} 
              disabled 
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth" className="text-sm">Date of Birth</Label>
            <Input 
              id="dateOfBirth" 
              type="date" 
              value={dateOfBirth} 
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="mt-2"
            />
          </div>

          <Button 
            onClick={() => {
              if (dateOfBirth) {
                localStorage.setItem('userDateOfBirth', dateOfBirth);
                toast({
                  title: "Profile updated",
                  description: "Your date of birth has been saved.",
                });
              }
            }} 
            className="w-full"
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Edit Full Profile</Label>
        <Button 
          variant="outline" 
          className="w-full justify-between"
          onClick={handleEditProfile}
        >
          <span>Update Health Profile</span>
          <Edit className="w-4 h-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Update gender, height, weight, activity level & sleep schedule
        </p>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Account</Label>
        <p className="text-sm text-muted-foreground mb-3">
          Password and authentication are managed through your account provider.
        </p>
        <Button 
          variant="destructive" 
          asChild 
          className="w-full"
        >
          <a href="/api/logout">Sign Out</a>
        </Button>
      </div>
    </div>
  );

  const renderAboutSection = () => (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => handleSectionChange('main')}>
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back
      </Button>

      <div className="space-y-3">
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/privacy" target="_blank">
            Privacy Policy
          </a>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/terms" target="_blank">
            Terms of Service
          </a>
        </Button>
      </div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'main':
        return renderMainMenu();
      case 'profile':
        return renderProfileSection();
      case 'general':
        return renderGeneralSection();
      case 'reminders':
        return renderRemindersSection();
      case 'sleep':
        return renderSleepSection();
      case 'fun':
        return renderFunSection();
      case 'styling':
        return renderStylingSection();
      case 'todo':
        return renderTodoSection();
      case 'calendar':
        return renderCalendarSection();
      case 'support':
        return renderSupportSection();
      case 'about':
        return renderAboutSection();
      default:
        return renderMainMenu();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setCurrentSection('main');
        onOpenChange?.(false);
      }
    }}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentSection === 'main' ? (
              <>
                <SettingsIcon className="w-5 h-5 text-primary" />
                Settings
              </>
            ) : currentSection === 'profile' ? (
              <>
                <User className="w-5 h-5 text-primary" />
                Profile
              </>
            ) : (
              <>
                {(() => {
                  const section = sections.find(s => s.id === currentSection);
                  const Icon = section?.icon;
                  return Icon ? <Icon className="w-5 h-5 text-primary" /> : null;
                })()}
                {sections.find(s => s.id === currentSection)?.label}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <div 
            key={currentSection}
            className={`transition-all duration-300 ease-in-out ${
              isTransitioning 
                ? 'opacity-0 transform translate-x-4' 
                : 'opacity-100 transform translate-x-0'
            }`}
          >
            {renderCurrentSection()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
