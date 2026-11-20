import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './premium/premium.css';

void fetch('/api/auth/prepare', { method: 'POST', cache: 'no-store' }).catch(() => undefined);

createRoot(document.getElementById('root')!).render(<App />);
