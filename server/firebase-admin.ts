import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!serviceAccountJson) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required for server-side Firebase operations.');
}

const serviceAccount = JSON.parse(serviceAccountJson) as {
  project_id: string;
  client_email: string;
  private_key: string;
};

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    projectId: firebaseConfig.projectId,
  });

export const adminAuth = getAuth(app);
export const adminDb =
  !firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)'
    ? getFirestore(app)
    : getFirestore(app, firebaseConfig.firestoreDatabaseId);
export { FieldValue, firebaseConfig };
