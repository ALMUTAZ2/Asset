import { adminDb } from './firebase-admin.js';
import { migrateLegacyCredentials } from './migrate-auth-credentials.js';
import { publishFirestoreRules } from './publish-firestore-rules.js';

const BOOTSTRAP_MARKER = 'firestore_security_v1';
type BootstrapResult = 'ready' | 'pending';

export async function prepareFirestoreSecurity(): Promise<BootstrapResult> {
  const stateRef = adminDb.collection('system_meta').doc(BOOTSTRAP_MARKER);
  const now = Date.now();
  const status = await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(stateRef);
    const state = snapshot.data();
    if (state?.complete === true) return 'ready' as const;
    const startedAt = Number(state?.startedAt || 0);
    if (state?.status === 'running' && startedAt && now - startedAt < 90_000) return 'pending' as const;
    transaction.set(stateRef, { status: 'running', startedAt: now, complete: false });
    return 'start' as const;
  });

  if (status === 'ready') return 'ready';
  if (status === 'pending') return 'pending';

  try {
    try {
      await publishFirestoreRules();
    } catch (rulesError) {
      console.warn(
        'Warning: Could not publish Firestore rules automatically (ensure Firebase Rules Admin role is granted, or deploy rules manually via Firebase CLI):',
        rulesError instanceof Error ? rulesError.message : rulesError
      );
    }
    await migrateLegacyCredentials();
    await stateRef.set({ complete: true, status: 'complete', completedAt: new Date().toISOString() });
    return 'ready';
  } catch (error) {
    await stateRef.set({ complete: false, status: 'failed', failedAt: new Date().toISOString() }, { merge: true }).catch(() => undefined);
    throw error;
  }
}
