import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ColorPicker, getThemeColor } from "@/components/general";

// Generic form field component
interface FormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'time' | 'date' | 'textarea' | 'select' | 'checkbox' | 'switch' | 'color';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  options = [],
  required = false,
  className = ""
}: FormFieldProps) {
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={className}
          />
        );
      
      case 'select':
        return (
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger className={className}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'checkbox':
        return (
          <Checkbox
            checked={value}
            onCheckedChange={onChange}
            className={className}
          />
        );
      
      case 'switch':
        return (
          <Switch
            checked={value}
            onCheckedChange={onChange}
            className={className}
          />
        );
      
      case 'color':
        return (
          <ColorPicker
            value={value}
            onChange={onChange}
            label=""
            className={className}
          />
        );
      
      default:
        return (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className={className}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
}

// Multi-day selector component
interface DaySelectorProps {
  label: string;
  value: string[];
  onChange: (days: string[]) => void;
  className?: string;
}

export function DaySelector({ label, value, onChange, className = "" }: DaySelectorProps) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  const toggleDay = (day: string) => {
    if (value.includes(day)) {
      onChange(value.filter(d => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => (
          <div key={day} className="flex items-center space-x-2">
            <Checkbox
              id={day}
              checked={value.includes(day)}
              onCheckedChange={() => toggleDay(day)}
            />
            <Label htmlFor={day} className="text-sm capitalize">
              {day.slice(0, 3)}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
}

// Time range picker component
interface TimeRangeProps {
  label: string;
  startTime: string;
  endTime: string;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  className?: string;
}

export function TimeRange({
  label,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  className = ""
}: TimeRangeProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="start-time" className="text-xs text-muted-foreground">Start Time</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="end-time" className="text-xs text-muted-foreground">End Time</Label>
          <Input
            id="end-time"
            type="time"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Form validation hook
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, (value: any) => string | null>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const setValue = (field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Validate field
    const rule = validationRules[field];
    if (rule) {
      const error = rule(value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
    
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validate = () => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const rule = validationRules[field as keyof T];
      if (rule) {
        const error = rule(values[field as keyof T]);
        if (error) {
          newErrors[field as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}
