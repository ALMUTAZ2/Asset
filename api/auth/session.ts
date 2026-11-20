import type { Request, Response } from 'express';
import { getBearerSession } from '../../server/auth.js';
import { isProductionRuntime } from '../../server/runtime.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'الجلسات متاحة على إصدار الإنتاج فقط.' });
    return;
  }

  const session = await getBearerSession(req);
  if (!session) {
    res.status(401).json({ error: 'انتهت الجلسة أو تم إيقاف الحساب.' });
    return;
  }
  res.status(200).json({ session });
}
