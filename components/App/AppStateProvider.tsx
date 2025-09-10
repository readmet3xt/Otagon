import React, { createContext, useContext, ReactNode } from 'react';
import { useAppState } from '../../hooks/useAppState';

interface AppStateContextType {
  state: ReturnType<typeof useAppState>;
}

const AppStateContext = createContext<AppStateContextType | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const state = useAppState();

  return (
    <AppStateContext.Provider value={{ state }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppStateContext = (): AppStateContextType => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppStateContext must be used within an AppStateProvider');
  }
  return context;
};
