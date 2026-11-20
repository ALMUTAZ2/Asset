import type { Request, Response } from 'express';
import { adminAuth, adminDb } from '../../server/firebase-admin.js';
import { isProductionRuntime } from '../../server/runtime.js';
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  credentialsAreMigrated,
  credentialDocumentId,
  hashSecret,
  setUserClaims,
  verifySecret,
} from '../../server/auth.js';

const identifierPattern = /^[a-zA-Z0-9_-]{1,64}$/;
const genericFailure = { error: 'بيانات الدخول غير صحيحة أو الحساب غير نشط.' };

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'Authorization');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'تسجيل الدخول متاح على إصدار الإنتاج فقط.' });
    return;
  }

  try {
    const body = req.body as Record<string, unknown> | undefined;
    const type = body?.type;
    const identity = type === 'staff'
      ? String(body?.username || '').trim().toLowerCase()
      : String(body?.name || '').trim();
    const secret = type === 'staff' ? String(body?.password || '') : String(body?.pin || '');
    if ((type !== 'staff' && type !== 'contractor') || !identity || !secret || identity.length > 150 || secret.length > 128) {
      res.status(400).json({ error: 'تحقق من البيانات المدخلة.' });
      return;
    }
    if (type === 'staff') {
      if (!identifierPattern.test(identity)) {
        res.status(401).json(genericFailure);
        return;
      }
      const profileSnapshot = await adminDb.collection('staff_users').doc(identity).get();
      if (!profileSnapshot.exists) {
        res.status(401).json(genericFailure);
        return;
      }
      if (!(await checkLoginRateLimit(identity))) {
        res.status(429).json({ error: 'محاولات كثيرة. يرجى الانتظار ثم المحاولة مجدداً.' });
        return;
      }
      if (!(await credentialsAreMigrated())) {
        res.status(503).json({ error: 'يلزم إكمال تهيئة بيانات الاعتماد الآمنة قبل تسجيل الدخول.' });
        return;
      }
      const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('staff', identity));
      const credentialSnapshot = await credentialRef.get();
      if (!credentialSnapshot.exists) {
        res.status(401).json(genericFailure);
        return;
      }
      const profile = profileSnapshot.data()!;
      const credential = credentialSnapshot.data()!;
      if (!['admin', 'reviewer', 'viewer'].includes(String(profile.role)) || !(await verifySecret(secret, String(credential.secret || ''), 'staff'))) {
        res.status(401).json(genericFailure);
        return;
      }
      if (!String(credential.secret).startsWith('scrypt$')) {
        await credentialRef.update({ secret: await hashSecret(secret), upgradedAt: new Date().toISOString() });
      }

      const claims = {
        type: 'staff' as const,
        name: String(profile.name || identity),
        username: identity,
        role: profile.role as 'admin' | 'reviewer' | 'viewer',
      };
      const uid = `staff_${identity}`;
      await setUserClaims(uid, claims);
      const customToken = await adminAuth.createCustomToken(uid, claims);
await clearLoginRateLimit(identity);
      res.status(200).json({ customToken, session: claims });
      return;
    }

    const matchingContractors = await adminDb.collection('contractors').where('name', '==', identity).limit(2).get();
    const activeContractors = matchingContractors.docs.filter((item) => item.data().active === true);
    if (activeContractors.length !== 1) {
      res.status(401).json(genericFailure);
      return;
    }
    const contractor = activeContractors[0];
    if (!(await checkLoginRateLimit(contractor.id))) {
      res.status(429).json({ error: 'محاولات كثيرة. يرجى الانتظار ثم المحاولة مجدداً.' });
      return;
    }
    if (!(await credentialsAreMigrated())) {
      res.status(503).json({ error: 'يلزم إكمال تهيئة بيانات الاعتماد الآمنة قبل تسجيل الدخول.' });
      return;
    }
    const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('contractor', contractor.id));
    const credentialSnapshot = await credentialRef.get();
    if (!credentialSnapshot.exists) {
      res.status(401).json(genericFailure);
      return;
    }
    const credential = credentialSnapshot.data()!;
    if (!(await verifySecret(secret, String(credential.secret || ''), 'contractor'))) {
      res.status(401).json(genericFailure);
      return;
    }
    if (!String(credential.secret).startsWith('scrypt$')) {
      await credentialRef.update({ secret: await hashSecret(secret), upgradedAt: new Date().toISOString() });
    }

    const claims = {
      type: 'contractor' as const,
      name: String(contractor.data().name),
      contractorId: contractor.id,
      role: 'contractor' as const,
    };
    const uid = `contractor_${contractor.id}`;
    await setUserClaims(uid, claims);
    const customToken = await adminAuth.createCustomToken(uid, claims);
    await clearLoginRateLimit(contractor.id);
    res.status(200).json({ customToken, session: claims });
  } catch (error) {
    console.error('Firebase sign-in request failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(500).json({ error: 'تعذر تسجيل الدخول حالياً. يرجى المحاولة لاحقاً.' });
  }
}
