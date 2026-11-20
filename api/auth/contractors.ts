import type { Request, Response } from 'express';
import { adminDb } from '../../server/firebase-admin.js';
import { isProductionRuntime } from '../../server/runtime.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'قائمة المقاولين متاحة على إصدار الإنتاج فقط.' });
    return;
  }

  try {
    const snapshot = await adminDb.collection('contractors').where('active', '==', true).limit(500).get();
    const names = snapshot.docs
      .map((item) => String(item.data().name || '').trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ar'));
    res.status(200).json({ names });
  } catch {
    res.status(503).json({ error: 'تعذر تحميل قائمة المقاولين.' });
  }
}
