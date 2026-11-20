import { readFile } from 'node:fs/promises';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from './firebase-admin.js';

export async function publishFirestoreRules(): Promise<void> {
  const app = getApps()[0];
  const credential = app?.options.credential;
  if (!credential) throw new Error('Firebase Admin credential is unavailable.');
  const { access_token: accessToken } = await credential.getAccessToken();
  const rulesSource = await readFile(`${process.cwd()}/firestore.rules`, 'utf8');
  const apiBase = `https://firebaserules.googleapis.com/v1/projects/${firebaseConfig.projectId}`;

  const rulesetResponse = await fetch(`${apiBase}/rulesets`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source: { files: [{ name: 'firestore.rules', content: rulesSource }] } }),
  });
  const ruleset = (await rulesetResponse.json()) as { name?: string; error?: { message?: string } };
  if (!rulesetResponse.ok || !ruleset.name) {
    throw new Error(`Unable to create Firestore ruleset: ${ruleset.error?.message || rulesetResponse.status}`);
  }

  const releaseId =
    !firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)'
      ? 'cloud.firestore'
      : `cloud.firestore/${firebaseConfig.firestoreDatabaseId}`;
  const releaseName = `projects/${firebaseConfig.projectId}/releases/${releaseId}`;
  const releaseResponse = await fetch(`${apiBase}/releases/${releaseId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      release: { name: releaseName, rulesetName: ruleset.name },
      updateMask: 'rulesetName',
    }),
  });
  const release = (await releaseResponse.json()) as { error?: { message?: string } };
  if (!releaseResponse.ok) {
    throw new Error(`Unable to publish Firestore rules: ${release.error?.message || releaseResponse.status}`);
  }
}
