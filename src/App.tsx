import { useEffect, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PLATFORM_MARKUP } from './platformMarkup';
import { initPlatformEngine } from './platformEngine';

function PlatformShell() {
  const [fatalError, setFatalError] = useState<Error | null>(null);

  useEffect(() => {
    const cleanup = initPlatformEngine((err) => {
      setFatalError(err);
    });
    return cleanup;
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
