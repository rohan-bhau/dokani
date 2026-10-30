'use client';

import { useEffect, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { initializeFromStorage } from '@/store/authSlice';

function AuthInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    store.dispatch(initializeFromStorage());
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}

