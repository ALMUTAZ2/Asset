import { adminDb } from '../server/firebase-admin';
import { prepareFirestoreSecurity } from '../server/secure-firestore';

const bootstrapStatus = await prepareFirestoreSecurity();
if (bootstrapStatus !== 'ready') throw new Error('Firestore security bootstrap is already running; retry after it completes.');

const [staff, contractors, marker] = await Promise.all([
  adminDb.collection('staff_users').get(),
  adminDb.collection('contractors').get(),
  adminDb.collection('system_meta').doc('auth_credentials_v1').get(),
]);
const remainingStaffSecrets = staff.docs.filter((item) => typeof item.data().passwordHash === 'string').length;
const remainingContractorPins = contractors.docs.filter((item) => typeof item.data().pin === 'string').length;
if (marker.data()?.complete !== true || remainingStaffSecrets || remainingContractorPins) {
  throw new Error('Credential migration did not finish; review the Firebase records before enabling sign-in.');
}

console.log(`Firestore rules published; migrated ${staff.size} staff profiles and ${contractors.size} contractors.`);
