import type { Request, Response } from 'express';
import { adminAuth, adminDb } from '../../server/firebase-admin.js';
import {
  credentialDocumentId,
  hashSecret,
  requireAdmin,
  setUserClaims,
} from '../../server/auth.js';
import { isProductionRuntime } from '../../server/runtime.js';

const validId = /^[a-zA-Z0-9_-]{1,64}$/;
const validRoles = ['admin', 'reviewer', 'viewer'] as const;

type ActionBody = {
  action?: string;
  id?: string;
  name?: string;
  username?: string;
  password?: string;
  pin?: string;
  role?: string;
};

export default async function handler(req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  if (!isProductionRuntime()) {
    res.status(503).json({ error: 'إدارة الحسابات متاحة على إصدار الإنتاج فقط.' });
    return;
  }

  try {
    const admin = await requireAdmin(req);
    if (!admin || !admin.username) {
      res.status(403).json({ error: 'هذه العملية تتطلب صلاحية مدير النظام.' });
      return;
    }

    const body = (req.body || {}) as ActionBody;
    const action = body.action;
    if (action === 'create-staff') {
      const username = String(body.username || '').trim().toLowerCase();
      const name = String(body.name || '').trim();
      const password = String(body.password || '');
      const role = body.role;
      if (!validId.test(username) || !name || name.length > 120 || password.length < 4 || password.length > 128 || !validRoles.includes(role as (typeof validRoles)[number])) {
        res.status(400).json({ error: 'تحقق من بيانات الموظف. كلمة المرور تتطلب 4 خانات على الأقل.' });
        return;
      }
      const profileRef = adminDb.collection('staff_users').doc(username);
      const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('staff', username));
      const [profile, credential] = await Promise.all([profileRef.get(), credentialRef.get()]);
      if (profile.exists || credential.exists) {
        res.status(409).json({ error: 'اسم المستخدم موجود مسبقاً.' });
        return;
      }
      const now = new Date().toISOString();
      const batch = adminDb.batch();
      batch.create(profileRef, { id: `st_${username}`, username, name, role, updatedAt: now });
      batch.create(credentialRef, { type: 'staff', username, secret: await hashSecret(password), createdAt: now });
      await batch.commit();
      res.status(201).json({ ok: true });
      return;
    }

    if (action === 'create-contractor') {
      const id = String(body.id || '').trim();
      const name = String(body.name || '').trim();
      const pin = String(body.pin || '');
      if (!validId.test(id) || !name || name.length > 150 || !/^\d{4,12}$/.test(pin)) {
        res.status(400).json({ error: 'تحقق من اسم المقاول والرقم السري الجديد (4 أرقام على الأقل).' });
        return;
      }
      const profileRef = adminDb.collection('contractors').doc(id);
      const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('contractor', id));
      const [profile, credential, sameName] = await Promise.all([
        profileRef.get(),
        credentialRef.get(),
        adminDb.collection('contractors').where('name', '==', name).limit(1).get(),
      ]);
      if (profile.exists || credential.exists || !sameName.empty) {
        res.status(409).json({ error: 'المقاول مسجل مسبقاً.' });
        return;
      }
      const now = new Date().toISOString();
      const batch = adminDb.batch();
      batch.create(profileRef, { id, name, active: true, updatedAt: now });
      batch.create(credentialRef, { type: 'contractor', contractorId: id, secret: await hashSecret(pin), createdAt: now });
      await batch.commit();
      res.status(201).json({ ok: true });
      return;
    }

    if (action === 'update-contractor-pin') {
      const id = String(body.id || '').trim();
      const pin = String(body.pin || '');
      if (!validId.test(id) || !/^\d{4,12}$/.test(pin)) {
        res.status(400).json({ error: 'الرقم السري يجب أن يتكون من 4 إلى 12 رقماً.' });
        return;
      }
      const profile = await adminDb.collection('contractors').doc(id).get();
      if (!profile.exists) {
        res.status(404).json({ error: 'المقاول غير موجود.' });
        return;
      }
      await adminDb.collection('auth_credentials').doc(credentialDocumentId('contractor', id)).set({
        type: 'contractor',
        contractorId: id,
        secret: await hashSecret(pin),
        updatedAt: new Date().toISOString(),
      });
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'update-staff-role') {
      const username = String(body.username || '').trim().toLowerCase();
      const role = body.role;
      if (!validId.test(username) || username === '100889' || !validRoles.includes(role as (typeof validRoles)[number])) {
        res.status(400).json({ error: 'بيانات الصلاحية غير صالحة.' });
        return;
      }
      const profileRef = adminDb.collection('staff_users').doc(username);
      const profileSnapshot = await profileRef.get();
      if (!profileSnapshot.exists) {
        res.status(404).json({ error: 'الموظف غير موجود.' });
        return;
      }
      await profileRef.update({ role, updatedAt: new Date().toISOString() });
      const uid = `staff_${username}`;
      try {
        const user = await adminAuth.getUser(uid);
        await adminAuth.setCustomUserClaims(uid, {
          ...(user.customClaims || {}),
          type: 'staff',
          name: String(profileSnapshot.data()?.name || username),
          username,
          role,
        });
      } catch (error) {
        if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'delete-staff') {
      const username = String(body.username || '').trim().toLowerCase();
      if (!validId.test(username) || username === '100889' || username === admin.username) {
        res.status(400).json({ error: 'لا يمكن حذف هذا الحساب.' });
        return;
      }
      const profileRef = adminDb.collection('staff_users').doc(username);
      const credentialRef = adminDb.collection('auth_credentials').doc(credentialDocumentId('staff', username));
      const profileSnapshot = await profileRef.get();
      if (!profileSnapshot.exists) {
        res.status(404).json({ error: 'الموظف غير موجود.' });
        return;
      }
      const batch = adminDb.batch();
      batch.delete(profileRef);
      batch.delete(credentialRef);
      await batch.commit();
      await adminAuth.deleteUser(`staff_${username}`).catch((error: unknown) => {
        if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
      });
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: 'عملية غير معروفة.' });
  } catch {
    res.status(500).json({ error: 'تعذر حفظ التغييرات حالياً.' });
  }
}
