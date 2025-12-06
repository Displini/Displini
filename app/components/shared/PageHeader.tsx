import React from 'react';

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function PageHeader({ children, className = "" }: PageHeaderProps) {
  return (
    <div className="z-50 bg-background">
      <div className={`px-4 py-4 ${className}`}>
        {children}
      </div>
    </div>
  );
}
