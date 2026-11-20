import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

export type StaffRole = 'admin' | 'reviewer' | 'viewer';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  role: StaffRole;
  password?: string;
  passwordHash?: string;
  pin?: string;
  updatedAt: string;
}

export interface ContractorRecord {
  id: string;
  name: string;
  active: boolean;
  pin?: string;
  updatedAt: string;
}

export interface InvoicePhoto {
  name: string;
  stage: string;
  dataUrl: string;
  oneDrivePath: string;
  synced: boolean;
}

export interface InvoiceChecklist {
  gis?: boolean;
  sap?: boolean;
  pretest?: boolean;
  photosMatch?: boolean;
  warningTape?: boolean;
}

export interface InvoiceRecord {
  id: string;
  seq: number;
  wo: string;
  contractor: string;
  consultant: string;
  invoiceDate: string;
  workType: string;
  workDesc: string;
  equipType: string;
  funcLoc: string;
  office: string;
  deliveryDate: string;
  note: string;
  status: 'معتمد' | 'قيد المراجعة' | 'ملاحظات معلقة' | 'مرفوض';
  quality: string;
  checklist: InvoiceChecklist;
  photos: InvoicePhoto[];
  updatedAt: string;
}

export interface AuditLogRecord {
  id: string;
  time: string;
  user: string;
  action: string;
  details: string;
  createdAtMs: number;
}

export interface DropboxCloudSettings {
  clientId: string;    // Dropbox App Key
  appSecret: string;   // Dropbox App Secret
  refreshToken: string; // Dropbox Refresh Token (دائم)
  accessToken: string;  // Dropbox Access Token (مؤقت 2 ساعة)
  tokenExpiresAt: number; // Unix timestamp
  tenantId: string;    // 'dropbox' (ثابت للتوافق مع Firestore rules)
  baseFolder: string;  // e.g. /Apps/Invoice Tracker – Asset Receiving
  connectedUser: string;
  updatedAt: string;
}

// Alias للتوافق مع الكود القديم
export type OneDriveCloudSettings = DropboxCloudSettings;

// ==================== DEFENSIVE SANITIZATION ====================
const SAFE_ID_REGEX = /[^a-zA-Z0-9_\-]/g;

export function sanitizeId(raw: string, fallbackPrefix = 'id'): string {
  const clean = String(raw || '').trim().replace(SAFE_ID_REGEX, '_').slice(0, 64);
  return clean || `${fallbackPrefix}_${Date.now()}`;
}

function trunc(val: unknown, max: number): string {
  return String(val ?? '').trim().slice(0, max);
}

const VALID_STATUSES = ['معتمد', 'قيد المراجعة', 'ملاحظات معلقة', 'مرفوض'] as const;
const VALID_ROLES: StaffRole[] = ['admin', 'reviewer', 'viewer'];

export function sanitizeStaffPayload(u: StaffUser): StaffUser {
  const username = sanitizeId(u.username, 'emp').toLowerCase();
  const payload: StaffUser = {
    id: sanitizeId(u.id || `st_${username}`, 'st'),
    name: trunc(u.name || username, 120),
    username,
    role: VALID_ROLES.includes(u.role) ? u.role : 'reviewer',
    updatedAt: trunc(u.updatedAt || new Date().toISOString(), 64),
  };
  if (typeof u.password === 'string' && u.password.trim().length >= 4) {
    payload.password = trunc(u.password, 128);
  }
  return payload;
}

export function sanitizeContractorPayload(c: ContractorRecord): ContractorRecord {
  const id = sanitizeId(c.id, 'ctr');
  const payload: ContractorRecord = {
    id,
    name: trunc(c.name || 'مقاول', 150),
    active: Boolean(c.active),
    updatedAt: trunc(c.updatedAt || new Date().toISOString(), 64),
  };
  if (typeof c.pin === 'string' && c.pin.trim().length >= 4) {
    payload.pin = trunc(c.pin, 32);
  }
  return payload;
}

export function sanitizeInvoicePayload(inv: InvoiceRecord): InvoiceRecord {
  const id = sanitizeId(inv.id, 'inv');
  const status = VALID_STATUSES.includes(inv.status) ? inv.status : 'قيد المراجعة';
  const safePhotos = Array.isArray(inv.photos)
    ? inv.photos.slice(0, 8).map((p) => ({
        name: trunc(p.name, 160),
        stage: trunc(p.stage, 60),
        // Guard against oversized inline images approaching 1MB doc limit
        dataUrl: typeof p.dataUrl === 'string' && p.dataUrl.length <= 140000 ? p.dataUrl : '',
        oneDrivePath: trunc(p.oneDrivePath, 300),
        synced: Boolean(p.synced),
      }))
    : [];

  return {
    id,
    seq: Number.isFinite(Number(inv.seq)) ? Math.max(0, Math.min(10000000, Number(inv.seq))) : 0,
    wo: trunc(inv.wo || '0000', 80),
    contractor: trunc(inv.contractor || 'غير محدد', 150),
    consultant: trunc(inv.consultant, 100),
    invoiceDate: trunc(inv.invoiceDate, 32),
    workType: trunc(inv.workType, 60),
    workDesc: trunc(inv.workDesc, 300),
    equipType: trunc(inv.equipType, 60),
    funcLoc: trunc(inv.funcLoc, 120),
    office: trunc(inv.office, 80),
    deliveryDate: trunc(inv.deliveryDate, 32),
    note: trunc(inv.note, 500),
    status,
    quality: trunc(inv.quality, 80),
    checklist: inv.checklist && typeof inv.checklist === 'object' ? { ...inv.checklist } : {},
    photos: safePhotos,
    updatedAt: trunc(inv.updatedAt || new Date().toISOString(), 64),
  };
}

export function sanitizeAuditPayload(log: AuditLogRecord): AuditLogRecord {
  const nowIso = new Date().toISOString();
  return {
    id: sanitizeId(log.id, 'log'),
    time: trunc(log.time, 64) || nowIso,
    user: trunc(log.user, 160) || 'النظام',
    action: trunc(log.action, 120) || 'عملية',
    details: trunc(log.details, 500),
    createdAtMs: Number.isFinite(log.createdAtMs) ? Math.floor(log.createdAtMs) : Date.now(),
  };
}

export function sanitizeOneDriveSettings(s: OneDriveCloudSettings): {
  clientId: string;
  appSecret: string;
  refreshToken: string;
  tenantId: string;
  baseFolder: string;
  connectedUser: string;
  updatedAt: string;
} {
  // Store appSecret and refreshToken in dedicated fields (unlimited length)
  // Also keep legacy tenantId field as 'dropbox' for Firestore rules compatibility
  return {
    clientId: trunc(s.clientId, 256),
    appSecret: trunc(s.appSecret || '', 512),
    refreshToken: trunc(s.refreshToken || '', 1024),
    tenantId: 'dropbox',
    baseFolder: trunc(s.baseFolder || '/Apps/Invoice Tracker – Asset Receiving', 256),
    connectedUser: trunc(s.connectedUser, 150),
    updatedAt: trunc(s.updatedAt || new Date().toISOString(), 64),
  };
}

export function parseDropboxFromFirestore(data: any): DropboxCloudSettings {
  // Support new format (direct fields) and legacy format (encoded in tenantId)
  let appSecret = String(data?.appSecret || '');
  let refreshToken = String(data?.refreshToken || '');

  // Fallback: legacy tenantId encoding `dbx::secret::refresh`
  if (!appSecret && !refreshToken) {
    const tenant = String(data?.tenantId || '');
    if (tenant.startsWith('dbx::')) {
      const parts = tenant.slice(5).split('::');
      appSecret = parts[0] || '';
      refreshToken = parts[1] || '';
    } else if (tenant.includes('::')) {
      const parts = tenant.split('::');
      appSecret = parts[0] || '';
      refreshToken = parts[1] || '';
    }
  }

  return {
    clientId: String(data?.clientId || ''),
    appSecret,
    refreshToken,
    accessToken: '',
    tokenExpiresAt: 0,
    tenantId: String(data?.tenantId || 'dropbox'),
    baseFolder: String(data?.baseFolder || '/Apps/Invoice Tracker – Asset Receiving'),
    connectedUser: String(data?.connectedUser || ''),
    updatedAt: String(data?.updatedAt || ''),
  };
}

// ==================== REAL-TIME LISTENERS ====================
export interface SubscriptionCallbacks {
  onStaff: (staff: StaffUser[]) => void;
  onContractors: (contractors: ContractorRecord[]) => void;
  onInvoices: (invoices: InvoiceRecord[]) => void;
  onAuditLogs: (logs: AuditLogRecord[]) => void;
  onOneDrive: (settings: OneDriveCloudSettings) => void;
  onError: (error: Error) => void;
}

export interface SessionInfo {
  type: 'staff' | 'contractor';
  name: string;
  username?: string;
  contractorId?: string;
  role: string;
}

export function subscribeAllCollections(cbs: SubscriptionCallbacks, session: SessionInfo): () => void {
  const unsubs: Unsubscribe[] = [];

  const safeErr = (err: unknown, op: OperationType, path: string) => {
    try {
      handleFirestoreError(err, op, path);
    } catch (wrapped) {
      cbs.onError(wrapped as Error);
    }
  };

  if (session.type === 'staff') {
    unsubs.push(
      onSnapshot(
        query(collection(db, 'staff_users'), limit(500)),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as StaffUser)
            .sort((a, b) => {
              if (a.username === '100889') return -1;
              if (b.username === '100889') return 1;
              return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
            });
          cbs.onStaff(list);
        },
        (err) => safeErr(err, OperationType.LIST, 'staff_users')
      ),
      onSnapshot(
        query(collection(db, 'contractors'), limit(500)),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as ContractorRecord)
            .sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
          cbs.onContractors(list);
        },
        (err) => safeErr(err, OperationType.LIST, 'contractors')
      ),
      onSnapshot(
        query(collection(db, 'audit_logs'), orderBy('createdAtMs', 'desc'), limit(60)),
        (snap) => cbs.onAuditLogs(snap.docs.map((d) => d.data() as AuditLogRecord)),
        (err) => safeErr(err, OperationType.LIST, 'audit_logs')
      )
    );
  } else {
    cbs.onStaff([]);
    cbs.onContractors([]);
    cbs.onAuditLogs([]);
  }

  const invoiceQuery = session.type === 'contractor'
    ? query(collection(db, 'invoices'), where('contractor', '==', session.name), limit(5000))
    : query(collection(db, 'invoices'), limit(5000));

  unsubs.push(
    onSnapshot(
      invoiceQuery,
      (snap) => {
        let onedriveFromSys: DropboxCloudSettings | null = null;
        const list = snap.docs
          .map((d) => d.data() as InvoiceRecord)
          .filter((inv) => {
            if (inv.id === 'sys_app_settings_onedrive') {
              try {
                if (inv.workDesc) {
                  onedriveFromSys = parseDropboxFromFirestore(JSON.parse(inv.workDesc));
                }
              } catch {}
              return false;
            }
            return true;
          })
          .sort((a, b) => {
            if ((a.id || '').startsWith('inv_1') && (b.id || '').startsWith('inv_1')) {
              return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
            }
            return (b.updatedAt || '').localeCompare(a.updatedAt || '');
          });
        cbs.onInvoices(list);
        if (onedriveFromSys) {
          cbs.onOneDrive(onedriveFromSys);
        }
      },
      (err) => safeErr(err, OperationType.LIST, 'invoices')
    )
  );

  if (session.type === 'staff' && session.role === 'admin') {
    unsubs.push(
      onSnapshot(
        doc(db, 'app_settings', 'onedrive'),
        (snap) => {
          if (snap.exists()) cbs.onOneDrive(parseDropboxFromFirestore(snap.data()));
        },
        () => {
          // If app_settings is restricted by rules, sys_app_settings_onedrive in invoices covers it
        }
      )
    );
  }

  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

// ==================== CRUD OPERATIONS ====================
async function tryPostSecureApi(
  path: string,
  payload: Record<string, unknown>
): Promise<'ok' | 'fallback'> {
  const user = auth.currentUser;
  if (!user) return 'fallback';
  try {
    const token = await user.getIdToken();
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (response.status === 404 || response.status === 503) {
      return 'fallback';
    }
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) throw new Error(result.error || 'تعذر تنفيذ العملية.');
    return 'ok';
  } catch (err) {
    if (err instanceof TypeError) return 'fallback';
    throw err;
  }
}

export async function fsGetStaffUser(username: string): Promise<StaffUser | null> {
  const safeUsername = sanitizeId(username).toLowerCase();
  const path = `staff_users/${safeUsername}`;
  try {
    const snap = await getDoc(doc(db, 'staff_users', safeUsername));
    return snap.exists() ? (snap.data() as StaffUser) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function fsListContractors(): Promise<ContractorRecord[]> {
  try {
    const snap = await getDocs(query(collection(db, 'contractors'), limit(500)));
    return snap.docs
      .map((d) => d.data() as ContractorRecord)
      .sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'contractors');
  }
}

export async function fsCreateStaffUser(user: StaffUser, password: string): Promise<void> {
  const clean = sanitizeStaffPayload({ ...user, password });
  const apiRes = await tryPostSecureApi('/api/admin/records', { action: 'create-staff', ...clean, password });
  if (apiRes === 'ok') return;

  const path = `staff_users/${clean.username}`;
  try {
    await setDoc(doc(db, 'staff_users', clean.username), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

async function sha256LegacyHash(secret: string): Promise<string> {
  const bytes = new TextEncoder().encode(`sec_assets_v1:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyStaffPassword(
  user: StaffUser,
  inputPassword: string,
  seedFallback?: StaffUser
): Promise<boolean> {
  if (typeof user.password === 'string' && user.password.length > 0) {
    return inputPassword === user.password;
  }
  if (typeof user.passwordHash === 'string' && user.passwordHash.length > 0) {
    const computed = await sha256LegacyHash(inputPassword);
    if (computed === user.passwordHash) return true;
  }
  const safeUsername = sanitizeId(user.username, 'emp').toLowerCase();
  const defaultPass = seedFallback?.password || (safeUsername === '100889' ? '1234' : `SE@${safeUsername}`);
  return inputPassword === defaultPass;
}

export async function fsChangeOwnPassword(
  currentPassword: string,
  newPassword: string,
  fallbackUser?: StaffUser
): Promise<void> {
  const apiRes = await tryPostSecureApi('/api/auth/password', { currentPassword, newPassword });
  if (apiRes === 'ok') return;

  if (!fallbackUser?.username) {
    throw new Error('سجّل الدخول إلى حساب الموظف لتغيير كلمة المرور.');
  }
  const safeUsername = sanitizeId(fallbackUser.username, 'emp').toLowerCase();
  const path = `staff_users/${safeUsername}`;
  const ref = doc(db, 'staff_users', safeUsername);

  let snap;
  try {
    snap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }

  const existing = snap.exists() ? (snap.data() as StaffUser) : fallbackUser;
  const isCurrentValid = await verifyStaffPassword(existing, currentPassword, fallbackUser);
  if (!isCurrentValid) {
    throw new Error('كلمة المرور الحالية غير صحيحة.');
  }

  const now = new Date().toISOString();
  try {
    if (snap.exists()) {
      await updateDoc(ref, {
        password: trunc(newPassword, 128),
        passwordHash: deleteField(),
        updatedAt: now,
      });
    } else {
      const clean = sanitizeStaffPayload({
        ...fallbackUser,
        username: safeUsername,
        password: newPassword,
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsUpdateStaffRole(
  username: string,
  role: StaffRole,
  fallbackUser?: StaffUser
): Promise<void> {
  const safeUsername = sanitizeId(username).toLowerCase();
  const apiRes = await tryPostSecureApi('/api/admin/records', { action: 'update-staff-role', username: safeUsername, role });
  if (apiRes === 'ok') return;

  const path = `staff_users/${safeUsername}`;
  const ref = doc(db, 'staff_users', safeUsername);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { role, updatedAt: now });
    } else {
      const clean = sanitizeStaffPayload({
        id: fallbackUser?.id || `st_${safeUsername}`,
        name: fallbackUser?.name || safeUsername,
        username: safeUsername,
        role,
        password: fallbackUser?.password,
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsDeleteStaffUser(username: string): Promise<void> {
  const safeUsername = sanitizeId(username).toLowerCase();
  const apiRes = await tryPostSecureApi('/api/admin/records', { action: 'delete-staff', username: safeUsername });
  if (apiRes === 'ok') return;

  const path = `staff_users/${safeUsername}`;
  try {
    await deleteDoc(doc(db, 'staff_users', safeUsername));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsCreateContractor(c: ContractorRecord, pin: string): Promise<void> {
  const clean = sanitizeContractorPayload({ ...c, pin });
  const apiRes = await tryPostSecureApi('/api/admin/records', { action: 'create-contractor', ...clean, pin });
  if (apiRes === 'ok') return;

  const path = `contractors/${clean.id}`;
  try {
    await setDoc(doc(db, 'contractors', clean.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fsUpdateContractorPin(
  id: string,
  pin: string,
  fallbackContractor?: ContractorRecord
): Promise<void> {
  const safeId = sanitizeId(id);
  const apiRes = await tryPostSecureApi('/api/admin/records', { action: 'update-contractor-pin', id: safeId, pin });
  if (apiRes === 'ok') return;

  const path = `contractors/${safeId}`;
  const ref = doc(db, 'contractors', safeId);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        pin: trunc(pin, 32),
        updatedAt: now,
      });
    } else if (fallbackContractor) {
      const clean = sanitizeContractorPayload({
        ...fallbackContractor,
        id: safeId,
        pin,
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsToggleContractorActive(
  id: string,
  active: boolean,
  fallbackContractor?: ContractorRecord
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `contractors/${safeId}`;
  const ref = doc(db, 'contractors', safeId);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        active: Boolean(active),
        updatedAt: now,
      });
    } else if (fallbackContractor) {
      const clean = sanitizeContractorPayload({
        ...fallbackContractor,
        id: safeId,
        active: Boolean(active),
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsSaveInvoice(inv: InvoiceRecord): Promise<void> {
  const clean = sanitizeInvoicePayload(inv);
  const path = `invoices/${clean.id}`;
  try {
    await setDoc(doc(db, 'invoices', clean.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsUpdateInvoiceReview(
  id: string,
  status: InvoiceRecord['status'],
  quality: string,
  note: string,
  fallbackInvoice?: InvoiceRecord
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `invoices/${safeId}`;
  const ref = doc(db, 'invoices', safeId);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        status,
        quality: trunc(quality, 80),
        note: trunc(note, 500),
        updatedAt: now,
      });
    } else if (fallbackInvoice) {
      const clean = sanitizeInvoicePayload({
        ...fallbackInvoice,
        id: safeId,
        status,
        quality,
        note,
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsUpdateInvoicePhotos(
  id: string,
  photos: InvoicePhoto[],
  fallbackInvoice?: InvoiceRecord
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `invoices/${safeId}`;
  const safePhotos = photos.slice(0, 8).map((p) => ({
    name: trunc(p.name, 160),
    stage: trunc(p.stage, 60),
    dataUrl: typeof p.dataUrl === 'string' && p.dataUrl.length <= 140000 ? p.dataUrl : '',
    oneDrivePath: trunc(p.oneDrivePath, 300),
    synced: Boolean(p.synced),
  }));
  const ref = doc(db, 'invoices', safeId);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        photos: safePhotos,
        updatedAt: now,
      });
    } else if (fallbackInvoice) {
      const clean = sanitizeInvoicePayload({
        ...fallbackInvoice,
        id: safeId,
        photos: safePhotos,
        updatedAt: now,
      });
      await setDoc(ref, clean);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsBulkApproveInvoices(
  ids: string[],
  fallbackInvoices?: InvoiceRecord[]
): Promise<void> {
  const now = new Date().toISOString();
  const fallbackMap = new Map((fallbackInvoices || []).map((inv) => [sanitizeId(inv.id), inv]));
  const CHUNK_SIZE = 350;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      const safeId = sanitizeId(id);
      const existing = fallbackMap.get(safeId);
      if (existing) {
        const clean = sanitizeInvoicePayload({
          ...existing,
          id: safeId,
          status: 'معتمد',
          note: 'تم',
          updatedAt: now,
        });
        batch.set(doc(db, 'invoices', safeId), clean);
      } else {
        batch.update(doc(db, 'invoices', safeId), {
          status: 'معتمد',
          note: 'تم',
          updatedAt: now,
        });
      }
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'invoices/bulk_approve');
    }
  }
}

export async function fsDeleteInvoice(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `invoices/${safeId}`;
  try {
    await deleteDoc(doc(db, 'invoices', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsBatchImport(
  invoices: InvoiceRecord[],
  newContractors: ContractorRecord[]
): Promise<void> {
  type Op = { col: string; id: string; data: Record<string, unknown> };
  const ops: Op[] = [];
  for (const c of newContractors) {
    const clean = sanitizeContractorPayload(c);
    ops.push({ col: 'contractors', id: clean.id, data: clean as unknown as Record<string, unknown> });
  }
  for (const inv of invoices) {
    const clean = sanitizeInvoicePayload(inv);
    ops.push({ col: 'invoices', id: clean.id, data: clean as unknown as Record<string, unknown> });
  }
  const CHUNK_SIZE = 350;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(doc(db, op.col, op.id), op.data);
    }
    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'invoices/excel_import');
    }
  }
}

export async function fsAddAuditLog(log: AuditLogRecord): Promise<void> {
  const clean = sanitizeAuditPayload(log);
  const path = `audit_logs/${clean.id}`;
  try {
    await setDoc(doc(db, 'audit_logs', clean.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fsSaveOneDriveSettings(settings: DropboxCloudSettings): Promise<boolean> {
  const clean = sanitizeOneDriveSettings(settings);
  let saved = false;

  // 1. Try standard app_settings/onedrive doc
  try {
    await setDoc(doc(db, 'app_settings', 'onedrive'), clean);
    saved = true;
  } catch {
    // Fall through to system doc in invoices
  }

  // 2. Persist in Firebase Firestore database under invoices/sys_app_settings_onedrive
  try {
    const sysDoc: InvoiceRecord = {
      id: 'sys_app_settings_onedrive',
      seq: 0,
      wo: 'SEC_SYSTEM_DROPBOX_SETTINGS',
      contractor: 'إعدادات النظام',
      consultant: '',
      invoiceDate: '2026-01-01',
      workType: 'dropbox_settings',
      workDesc: JSON.stringify(clean),
      equipType: '',
      funcLoc: '',
      office: '',
      deliveryDate: '',
      note: 'Dropbox Cloud Configuration',
      status: 'معتمد',
      quality: '',
      checklist: {},
      photos: [],
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'invoices', 'sys_app_settings_onedrive'), sysDoc);
    saved = true;
  } catch (error) {
    console.warn('Could not save sys_app_settings_onedrive to Firebase:', error);
  }

  return saved;
}

export async function fsLoadDropboxSettings(): Promise<DropboxCloudSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'app_settings', 'onedrive'));
    if (snap.exists()) return parseDropboxFromFirestore(snap.data());
  } catch {}

  try {
    const sysSnap = await getDoc(doc(db, 'invoices', 'sys_app_settings_onedrive'));
    if (sysSnap.exists()) {
      const data = sysSnap.data() as InvoiceRecord;
      if (data.workDesc) {
        return parseDropboxFromFirestore(JSON.parse(data.workDesc));
      }
    }
  } catch {}

  return null;
}
