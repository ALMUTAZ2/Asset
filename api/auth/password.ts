import type { Request, Response } from 'express';
import { adminDb } from '../../server/firebase-admin.js';
import {
  credentialDocumentId,
  getBearerSession,
  hashSecret,
  verifySecret,
} from '../../server/auth.js';
import { isProductionRuntime } from '../../server/runtime.js';

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'إدارة الحساب متاحة على إصدار الإنتاج فقط.' });
    return;
  }

  try {
    const session = await getBearerSession(req);
    if (!session || session.type !== 'staff' || !session.username) {
      res.status(401).json({ error: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً.' });
      return;
    }
    const body = req.body as Record<string, unknown> | undefined;
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '');
    if (newPassword.length < 4 || newPassword.length > 128) {
      res.status(400).json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 4 خانات على الأقل.' });
      return;
    }

    const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('staff', session.username));
    const credentialSnapshot = await credentialRef.get();
    const stored = String(credentialSnapshot.data()?.secret || '');
    if (!credentialSnapshot.exists || !(await verifySecret(currentPassword, stored, 'staff'))) {
      res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
      return;
    }
    await credentialRef.update({ secret: await hashSecret(newPassword), updatedAt: new Date().toISOString() });
    res.status(200).json({ ok: true });
  } catch {
    res.status(500).json({ error: 'تعذر تحديث كلمة المرور حالياً.' });
  }
}
