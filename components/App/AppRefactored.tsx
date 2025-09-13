import React from 'react';
import { AppStateProvider } from './AppStateProvider';
import RefactoredApp from './RefactoredApp';

const AppRefactored: React.FC = () => {
  return (
    <AppStateProvider>
      <RefactoredApp />
    </AppStateProvider>
  );
};

export default AppRefactored;
