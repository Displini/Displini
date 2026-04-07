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
  const progress = total > 0 ? completed / total : 0;
  const remaining = Math.max(0, total - completed);

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      {/* Gauge arc + KPIs on same line - remaining/target pushed outwards */}
      <div className="relative w-[260px] sm:w-[360px] h-[72px] sm:h-[88px]">
        {/* Gauge arc - centered */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[200px] sm:w-[280px] h-16 sm:h-20">
          <svg viewBox="0 0 180 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              pathLength={100}
              className="stroke-primary/20"
            />
            <path
              d="M 10 90 A 80 80 0 0 1 170 90"
              fill="none"
              stroke="currentColor"
              strokeWidth="9"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${progress * 100} 1000`}
              strokeDashoffset={0}
              className="stroke-primary transition-all duration-300 ease-out"
            />
          </svg>
        </div>
        {/* KPIs - remaining left, completed centered under gauge, target right */}
        <div className="absolute inset-x-0 bottom-0 flex items-end">
          <div className="flex flex-col items-center text-center shrink-0 pl-2 sm:pl-4">
            <span className="text-lg sm:text-xl font-bold text-foreground">{remaining}</span>
            <span className="text-sm sm:text-base text-muted-foreground">remaining</span>
          </div>
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center text-center">
            <span className="text-lg sm:text-xl font-bold text-foreground">{completed}</span>
            <span className="text-sm sm:text-base text-muted-foreground">completed</span>
          </div>
          <div className="flex flex-col items-center text-center shrink-0 ml-auto pr-2 sm:pr-4">
            <span className="text-lg sm:text-xl font-bold text-foreground">{total}</span>
            <span className="text-sm sm:text-base text-muted-foreground">target</span>
          </div>
        </div>
      </div>
    </div>
  );
}
