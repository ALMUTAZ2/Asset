import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PLATFORM_MARKUP } from './platformMarkup';
import { initPlatformEngine } from './platformEngine';
import { initPremiumUX } from './premium/enhance';

function PlatformShell() {
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    const cleanup = initPlatformEngine((err) => {
      setFatalError(err);
    });
    const cleanupUX = initPremiumUX();
    return () => {
      cleanupUX();
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  if (fatalError) {
    throw fatalError;
  }

  return (
    <div
      className="font-cairo antialiased selection:bg-accent-500 selection:text-white"
      dangerouslySetInnerHTML={{ __html: PLATFORM_MARKUP }}
    />
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PlatformShell />
    </ErrorBoundary>
  );
}
