import React, { useEffect, useState } from 'react';
import { HeaderCollapseProvider } from '@/contexts/HeaderCollapseContext';

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** When true, full date row collapses when user scrolls down the page */
  collapsibleOnScroll?: boolean;
  /** When true, header is fixed at top and never scrolls away */
  fixed?: boolean;
}

export function PageHeader({ children, className = "", collapsibleOnScroll = false, fixed = false }: PageHeaderProps) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!collapsibleOnScroll) return;

    const getScrollY = () => {
      const winScroll = window.scrollY ?? window.pageYOffset;
      const docScroll = document.documentElement?.scrollTop ?? document.body?.scrollTop ?? 0;
      return Math.max(winScroll, docScroll);
    };

    const handleScroll = () => {
      let y = getScrollY();
      // Todo page uses a scroll container - check it first
      const todoScroll = document.querySelector('[data-todo-scroll-container]');
      if (todoScroll) {
        y = Math.max(y, todoScroll.scrollTop);
      }
      if (y > 80) setCollapsed(true);
      else if (y < 40) setCollapsed(false);
    };

    // Listen to window scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Todo page scroll container (where actual scroll happens)
    const todoScroll = document.querySelector('[data-todo-scroll-container]') as HTMLElement | null;
    if (todoScroll) {
      todoScroll.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (todoScroll) todoScroll.removeEventListener('scroll', handleScroll);
    };
  }, [collapsibleOnScroll]);

  const positionClass = fixed ? "fixed top-0 left-0 right-0" : "sticky top-0";
  const content = (
    <div className={`${positionClass} z-50 backdrop-blur-2xl bg-white/40 dark:bg-gray-900/40 border-b border-white/30 dark:border-gray-700/30`}>
      <div className={`px-4 py-3 ${className}`}>
        {children}
      </div>
    </div>
  );

  if (collapsibleOnScroll) {
    return <HeaderCollapseProvider collapsed={collapsed}>{content}</HeaderCollapseProvider>;
  }
  return content;
}
