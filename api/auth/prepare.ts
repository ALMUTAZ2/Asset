import type { Request, Response } from 'express';
import { prepareFirestoreSecurity } from '../../server/secure-firestore.js';
import { isProductionRuntime } from '../../server/runtime.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'تهيئة قاعدة البيانات متاحة على إصدار الإنتاج فقط.' });
    return;
  }

  try {
    const status = await prepareFirestoreSecurity();
    if (status === 'pending') {
      res.setHeader('Retry-After', '2');
      res.status(202).json({ ready: false });
      return;
    }
    res.status(200).json({ ready: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Firestore security bootstrap failed:', errorMsg);
    res.status(503).json({
      error: 'تعذر تفعيل حماية قاعدة البيانات حالياً. تأكد من منح حساب الخدمة صلاحيات Cloud Datastore User و Firebase Rules Admin.',
      details: errorMsg,
    });
  }
}
