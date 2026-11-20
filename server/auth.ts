import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { adminAuth, adminDb } from './firebase-admin.js';

function deriveSecret(secret: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(secret, salt, 64, { N: 1 << 14, r: 8, p: 1 }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived as Buffer);
    });
  });
}
const MIGRATION_MARKER = 'auth_credentials_v1';
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;

export type SessionClaims = {
  type: 'staff' | 'contractor';
  name: string;
  username?: string;
  contractorId?: string;
  role: 'admin' | 'reviewer' | 'viewer' | 'contractor';
};

export async function getBearerSession(req: Request): Promise<SessionClaims | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(header.slice(7), true);
    const type = decoded.type;
    if (
      type === 'staff' &&
      typeof decoded.username === 'string' &&
      decoded.uid === `staff_${decoded.username}`
    ) {
      const profile = await adminDb.collection('staff_users').doc(decoded.username).get();
      if (!profile.exists || !['admin', 'reviewer', 'viewer'].includes(String(profile.data()?.role))) return null;
      const user = profile.data()!;
      return {
        type,
        name: String(user.name || decoded.name || ''),
        username: decoded.username,
        role: user.role,
      };
    }
    if (
      type === 'contractor' &&
      typeof decoded.contractorId === 'string' &&
      decoded.uid === `contractor_${decoded.contractorId}`
    ) {
      const profile = await adminDb.collection('contractors').doc(decoded.contractorId).get();
      if (!profile.exists || profile.data()?.active !== true) return null;
      return {
        type,
        name: String(profile.data()?.name || ''),
        contractorId: decoded.contractorId,
        role: 'contractor',
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function requireAdmin(req: Request): Promise<SessionClaims | null> {
  const session = await getBearerSession(req);
  if (!session || session.type !== 'staff' || session.role !== 'admin') return null;
  return session;
}

export async function credentialsAreMigrated(): Promise<boolean> {
  const snapshot = await adminDb.collection('system_meta').doc(MIGRATION_MARKER).get();
  return snapshot.data()?.complete === true;
}

export async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = await deriveSecret(secret, salt);
  return `scrypt$${salt}$${derived.toString('hex')}`;
}

function equalStrings(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

export async function verifySecret(secret: string, stored: string, kind: 'staff' | 'contractor'): Promise<boolean> {
  if (stored.startsWith('scrypt$')) {
    const [, salt, expectedHex] = stored.split('$');
    if (!salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) return false;
    const actual = await deriveSecret(secret, salt);
    return timingSafeEqual(actual, Buffer.from(expectedHex, 'hex'));
  }

  if (kind === 'contractor') return equalStrings(secret, stored);

  const legacyHash = createHash('sha256').update(`sec_assets_v1:${secret}`).digest('hex');
  return equalStrings(legacyHash, stored);
}

export function credentialDocumentId(type: 'staff' | 'contractor', id: string): string {
  return `${type}_${id}`;
}

function rateLimitRef(identity: string) {
  const key = createHash('sha256').update(identity.toLowerCase()).digest('hex');
  return adminDb.collection('auth_login_limits').doc(key);
}

export async function checkLoginRateLimit(identity: string): Promise<boolean> {
  const ref = rateLimitRef(identity);
  const now = Date.now();
  return adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const windowStartedAt = Number(data?.windowStartedAt || 0);
    const attempts = windowStartedAt && now - windowStartedAt < LOGIN_WINDOW_MS
      ? Number(data?.attempts || 0)
      : 0;
    if (attempts >= LOGIN_MAX_ATTEMPTS) return false;
    transaction.set(ref, {
      attempts: attempts + 1,
      windowStartedAt: attempts ? windowStartedAt : now,
      updatedAt: now,
    });
    return true;
  });
}

export async function clearLoginRateLimit(identity: string): Promise<void> {
  await rateLimitRef(identity).delete().catch(() => undefined);
}

export async function setUserClaims(uid: string, claims: SessionClaims): Promise<void> {
  try {
    await adminAuth.getUser(uid);
  } catch (error) {
    if ((error as { code?: string }).code !== 'auth/user-not-found') throw error;
    await adminAuth.createUser({ uid, displayName: claims.name });
  }
  await adminAuth.setCustomUserClaims(uid, claims);
}
