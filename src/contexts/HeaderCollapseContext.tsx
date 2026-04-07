import React, { createContext, useContext } from 'react';

const HeaderCollapseContext = createContext<boolean>(false);

export function HeaderCollapseProvider({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <HeaderCollapseContext.Provider value={collapsed}>
      {children}
    </HeaderCollapseContext.Provider>
  );
}

export function useHeaderCollapsed() {
  return useContext(HeaderCollapseContext);
}
