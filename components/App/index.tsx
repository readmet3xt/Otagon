import React from 'react';
import { AppStateProvider } from './AppStateProvider';
import RefactoredApp from './RefactoredApp';

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <RefactoredApp />
    </AppStateProvider>
  );
};

export default App;
