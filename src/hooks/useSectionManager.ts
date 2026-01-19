import { useState, useEffect } from 'react';

interface SectionManagerConfig<T extends string> {
  storagePrefix: string; // e.g., 'health', 'food', 'sport'
  defaultOrder: T[];
  defaultVisibility: Record<T, boolean>;
}

export function useSectionManager<T extends string>({
  storagePrefix,
  defaultOrder,
  defaultVisibility,
}: SectionManagerConfig<T>) {
  // Section visibility/enabled state
  const [enabledSections, setEnabledSections] = useState<Record<T, boolean>>(() => {
    const saved = localStorage.getItem(`${storagePrefix}EnabledSections`);
    return saved ? JSON.parse(saved) : defaultVisibility;
  });

  // Section order
  const [sectionOrder, setSectionOrder] = useState<T[]>(() => {
    const saved = localStorage.getItem(`${storagePrefix}SectionOrder`);
    return saved ? JSON.parse(saved) : defaultOrder;
  });

  // Section minimized state
  const [minimizedSections, setMinimizedSections] = useState<Record<T, boolean>>(() => {
    const saved = localStorage.getItem(`${storagePrefix}MinimizedSections`);
    return saved ? JSON.parse(saved) : {};
  });

  // Persist to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}EnabledSections`, JSON.stringify(enabledSections));
  }, [enabledSections, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}SectionOrder`, JSON.stringify(sectionOrder));
  }, [sectionOrder, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}MinimizedSections`, JSON.stringify(minimizedSections));
  }, [minimizedSections, storagePrefix]);

  return {
    enabledSections,
    setEnabledSections,
    sectionOrder,
    setSectionOrder,
    minimizedSections,
    setMinimizedSections,
  };
}

