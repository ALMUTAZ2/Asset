import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { adminDb } from './firebase-admin.js';
import { credentialDocumentId, hashSecret } from './auth.js';

const MIGRATION_MARKER = 'auth_credentials_v1';

export async function migrateLegacyCredentials(): Promise<void> {
  const marker = adminDb.collection('system_meta').doc(MIGRATION_MARKER);
  if ((await marker.get()).data()?.complete === true) return;

  const [staffSnapshot, contractorSnapshot] = await Promise.all([
    adminDb.collection('staff_users').get(),
    adminDb.collection('contractors').get(),
  ]);
  const operations: Array<{
    profile: DocumentReference;
    credentialId: string;
    credential: Record<string, unknown>;
    secretField: 'passwordHash' | 'pin';
  }> = [];

  for (const snapshot of staffSnapshot.docs) {
    const secret = snapshot.data().passwordHash;
    if (typeof secret === 'string' && secret) {
      operations.push({
        profile: snapshot.ref,
        credentialId: credentialDocumentId('staff', snapshot.id),
        credential: { type: 'staff', username: snapshot.id, secret, migratedAt: new Date().toISOString() },
        secretField: 'passwordHash',
      });
    }
  }

  for (const snapshot of contractorSnapshot.docs) {
    const pin = snapshot.data().pin;
    if (typeof pin === 'string' && pin) {
      operations.push({
        profile: snapshot.ref,
        credentialId: credentialDocumentId('contractor', snapshot.id),
        credential: {
          type: 'contractor',
          contractorId: snapshot.id,
          secret: await hashSecret(pin),
          migratedAt: new Date().toISOString(),
        },
        secretField: 'pin',
      });
    }
  }

  for (let index = 0; index < operations.length; index += 200) {
    const batch = adminDb.batch();
    for (const operation of operations.slice(index, index + 200)) {
      batch.set(adminDb.collection('auth_credentials').doc(operation.credentialId), operation.credential);
      batch.update(operation.profile, { [operation.secretField]: FieldValue.delete() });
    }
    await batch.commit();
  }

  await marker.set({ complete: true, migratedAt: new Date().toISOString(), movedCount: operations.length });
}
