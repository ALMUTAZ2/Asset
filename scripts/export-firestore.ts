import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const sa = {
  type: 'service_account',
  project_id: 'gen-lang-client-0851514818',
  private_key_id: '75e3b3db58652e21648edea98df30ec8cd0660f9',
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7YB4dsdRcP5c8\nY5wszWvtRCNNRWgbZ0vVQPOXrWcFCVo54q73D15f029Y80WD8nEuB2BDWJgtLYVB\nRO6M0fhRTa2SRLoDzSBtFGK0+eZdvZNsOOcWUdgjhgbcAgD9z5evwt5Oa9iOqwTy\nqV8DlH/KBep+LDRjjI49hSQNUgWuiXE74o6DCA9RqXBB6juBa78H/+tWIVZVU6/l\nSTFyIJiztki2KNSH6rP1LdznQSZHjmu5x1ier90U9zWSkEwT1+lOMtPPYZPYDdYm\nG3cSSiDij0pMv4z0eX3YN6ODMGwP+y3r2OJLREFf0OGgmMxe+KYGHRGIJOBT0EoU\nfCbHBdBRAgMBAAECggEATU87HcVheS5DmAcBSPr4rMyQRDF+4s+b2kESQGKrPsi9\nEWUWC5mrtp3mMy0sYWSGjhc9AIxtPTaq5GMsia2YZvNFyjPRDAB2gIsIruLsyYCO\ncviHYA4kv4NtERlCj3Y3f61HS9PzZenqALUhHrkGgLQwLB7Q/sHfbkKgvV46OeiF\nmOrOh/h3D0gFmeDOnIrmsSMFdw8u9OFmEkH3u746NnRb2033ENY7MyFMyF46V1XR\nbNtXysUQ3/5UaHVCIR6zuYc+nMp+5rv5PBiLf4mkAS7CBGPzE8OnqfYGsGyybwMc\nS4zp0bLsZJBVPKCSQ2FPDqpG/MC/DOjr8+FP8eiUgQKBgQD0pqYwS4qO/tp76LkM\npFr7JrR+iiiWhJaHG5mUDY6t/Jg6kLKHWhzeZywjwolXGeFbLYouBffIG2jE0ChC\nHxzYdwPkPJScnHch5HEvI7xr6g4HGu4lsWIEGF9xWGQ5Jmo0ZfBhUxJDGMhhXm+I\nI+owgmCOiJ4LWVJgfH7tlJmw+wKBgQDEEUskehMsBxPU0p4q8z4tpm2/j3zIQn8Z\nwbujeUQmzunF5NbFdv5/H3XB1nNQo/rXkPcjkhVvNWX0Ld18kL8cH6NYqW+x/r4W\nywo/OJQJFzqkkOP28WFw1a3tVaJdEHGptMeU+ljKP8sPIddTpOgcmLQgeFV9S05q\nYaJMtRF6IwKBgEQw6yOM+rruyEE/VczzRrS4ThjzM2r42+gexkjhGoLeZCP2zvwx\nHtjS0xfIknVnrku2vswjN7RcB3DMQFxlxamESt5kEFwytHYK8Y1dHZjKrUxHsldp\nQNO5Y2j5ZT4UugeO3liSSgXPs5KIOvgsYotQ287+v2aUaASiztIz2D7fAoGBALO6\nEoJ2cJqcRj6BbsF6RdX8yH+fnUfJRM8ser9ISwO0CjEAKyvJf1KyWPR9iykxl6AA\n37q4j3NopHOnk287FCRIkCiW8K9eD4u/RT5cs759j6EIvB9CdwrCpPN42yOqDjb9\nYzIaJkgHIDFX2RVwheCozf0xsVPwMwprQyZDmKi3AoGAf8+kaSPRhkcvuVDYpIbl\noXcRjdHxctr6PV5mRiG4EPs91drRGDpfcqNvTee4yB9SBreDq1bf8JhvJnZ5zl07\nUV6Dmp+FtPiF20wg5WpEiE/duXBpgQs20b5jTDEuMAElzR9jMc1KJgSTyHZTq5uQ\nwS1/XMZhhE1CUDM1nId4P4M=\n-----END PRIVATE KEY-----\n",
  client_email: 'firebase-adminsdk-fbsvc@gen-lang-client-0851514818.iam.gserviceaccount.com'
};

const app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
const dbId = 'ai-studio-remixuntitled-22ca139d-67d4-4938-b78a-773e2e06c8f0';
const db = getFirestore(app, dbId);

async function exportAll() {
  const exportDir = path.resolve('firebase_backup');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const collections = ['app_settings', 'audit_logs', 'contractors', 'invoices', 'staff_users', 'system_meta'];
  const summary: Record<string, number> = {};

  for (const colName of collections) {
    console.log(`Downloading collection [${colName}]...`);
    const snap = await db.collection(colName).get();
    const data: Record<string, any> = {};
    snap.docs.forEach((d) => {
      data[d.id] = d.data();
    });
    fs.writeFileSync(path.join(exportDir, `${colName}.json`), JSON.stringify(data, null, 2), 'utf8');
    summary[colName] = snap.size;
    console.log(`Saved ${snap.size} documents for [${colName}].`);
  }

  fs.writeFileSync(path.join(exportDir, '_summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  console.log('Export completed successfully:', summary);
}

exportAll().then(() => process.exit(0)).catch((err) => {
  console.error('Export error:', err);
  process.exit(1);
});
