import React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CircularProgress({ 
  completed, 
  total, 
  size = 80, 
  strokeWidth = 6,
  className 
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = total > 0 ? completed / total : 0;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress * circumference);

  // Always use primary color (same as liquid timeline) for all states
  const getColor = () => "stroke-primary"; // Always match liquid timeline color

  const getBackgroundColor = () => "stroke-primary/20"; // Always match liquid timeline color with opacity

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className={getBackgroundColor()}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-300 ease-in-out",
            getColor()
          )}
        />
      </svg>
      
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {completed}
          </div>
          <div className="text-xs text-muted-foreground">
            out of {total}
          </div>
          <div className="text-xs text-muted-foreground">
            tasks
          </div>
        </div>
      </div>
    </div>
  );
}
