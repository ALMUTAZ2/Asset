import {
  collection,
  deleteDoc,
  doc,
  getDoc,
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
  pin?: string;
  updatedAt: string;
}

export interface ContractorRecord {
  id: string;
  name: string;
  active: boolean;
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
  const username = sanitizeId(u.username, 'emp');
  return {
    id: sanitizeId(u.id || `st_${username}`, 'st'),
    name: trunc(u.name || username, 120),
    username,
    role: VALID_ROLES.includes(u.role) ? u.role : 'reviewer',
    updatedAt: trunc(u.updatedAt || new Date().toISOString(), 64),
  };
}

export function sanitizeContractorPayload(c: ContractorRecord): ContractorRecord {
  const id = sanitizeId(c.id, 'ctr');
  return {
    id,
    name: trunc(c.name || 'مقاول', 150),
    active: Boolean(c.active),
    updatedAt: trunc(c.updatedAt || new Date().toISOString(), 64),
  };
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
  return {
    id: sanitizeId(log.id, 'log'),
    time: trunc(log.time, 64),
    user: trunc(log.user || 'النظام', 160),
    action: trunc(log.action || 'عملية', 120),
    details: trunc(log.details, 500),
    createdAtMs: Number.isFinite(log.createdAtMs) ? log.createdAtMs : Date.now(),
  };
}

export function sanitizeOneDriveSettings(s: OneDriveCloudSettings): {
  clientId: string;
  tenantId: string;
  baseFolder: string;
  connectedUser: string;
  updatedAt: string;
} {
  const secret = trunc(s.appSecret || '', 55);
  const refresh = trunc(s.refreshToken || '', 65);
  const tenantVal = (secret || refresh) ? `dbx::${secret}::${refresh}` : trunc(s.tenantId || 'dropbox', 128);
  return {
    clientId: trunc(s.clientId, 128),
    tenantId: trunc(tenantVal, 128),
    baseFolder: trunc(s.baseFolder || '/Apps/Invoice Tracker – Asset Receiving', 200),
    connectedUser: trunc(s.connectedUser, 150),
    updatedAt: trunc(s.updatedAt || new Date().toISOString(), 64),
  };
}

export function parseDropboxFromFirestore(data: any): DropboxCloudSettings {
  let appSecret = '';
  let refreshToken = '';
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

  return {
    clientId: String(data?.clientId || ''),
    appSecret,
    refreshToken,
    accessToken: '',
    tokenExpiresAt: 0,
    tenantId: tenant || 'dropbox',
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
        const list = snap.docs
          .map((d) => d.data() as InvoiceRecord)
          .sort((a, b) => {
            if ((a.id || '').startsWith('inv_1') && (b.id || '').startsWith('inv_1')) {
              return (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
            }
            return (b.updatedAt || '').localeCompare(a.updatedAt || '');
          });
        cbs.onInvoices(list);
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
        (err) => safeErr(err, OperationType.GET, 'app_settings/onedrive')
      )
    );
  }

  return () => unsubs.forEach((unsubscribe) => unsubscribe());
}

// ==================== CRUD OPERATIONS ====================
async function postSecureApi(path: string, payload: Record<string, unknown>): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Authentication required.');
  const token = await user.getIdToken();
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(result.error || 'تعذر تنفيذ العملية.');
}

export async function fsCreateStaffUser(user: StaffUser, password: string): Promise<void> {
  const clean = sanitizeStaffPayload(user);
  await postSecureApi('/api/admin/records', { action: 'create-staff', ...clean, password });
}

export async function fsChangeOwnPassword(currentPassword: string, newPassword: string): Promise<void> {
  await postSecureApi('/api/auth/password', { currentPassword, newPassword });
}

export async function fsUpdateStaffRole(username: string, role: StaffRole): Promise<void> {
  await postSecureApi('/api/admin/records', { action: 'update-staff-role', username: sanitizeId(username), role });
}

export async function fsDeleteStaffUser(username: string): Promise<void> {
  await postSecureApi('/api/admin/records', { action: 'delete-staff', username: sanitizeId(username) });
}

export async function fsCreateContractor(c: ContractorRecord, pin: string): Promise<void> {
  const clean = sanitizeContractorPayload(c);
  await postSecureApi('/api/admin/records', { action: 'create-contractor', ...clean, pin });
}

export async function fsUpdateContractorPin(id: string, pin: string): Promise<void> {
  await postSecureApi('/api/admin/records', { action: 'update-contractor-pin', id: sanitizeId(id), pin });
}

export async function fsToggleContractorActive(id: string, active: boolean): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `contractors/${safeId}`;
  try {
    await updateDoc(doc(db, 'contractors', safeId), {
      active: Boolean(active),
      updatedAt: new Date().toISOString(),
    });
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
  note: string
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `invoices/${safeId}`;
  try {
    await updateDoc(doc(db, 'invoices', safeId), {
      status,
      quality: trunc(quality, 80),
      note: trunc(note, 500),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsUpdateInvoicePhotos(id: string, photos: InvoicePhoto[]): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `invoices/${safeId}`;
  const safePhotos = photos.slice(0, 8).map((p) => ({
    name: trunc(p.name, 160),
    stage: trunc(p.stage, 60),
    dataUrl: typeof p.dataUrl === 'string' && p.dataUrl.length <= 140000 ? p.dataUrl : '',
    oneDrivePath: trunc(p.oneDrivePath, 300),
    synced: Boolean(p.synced),
  }));
  try {
    await updateDoc(doc(db, 'invoices', safeId), {
      photos: safePhotos,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsBulkApproveInvoices(ids: string[]): Promise<void> {
  const now = new Date().toISOString();
  const CHUNK_SIZE = 350;
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.update(doc(db, 'invoices', sanitizeId(id)), {
        status: 'معتمد',
        note: 'تم',
        updatedAt: now,
      });
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

export async function fsSaveOneDriveSettings(settings: DropboxCloudSettings): Promise<void> {
  const clean = sanitizeOneDriveSettings(settings);
  const path = 'app_settings/onedrive';
  try {
    await setDoc(doc(db, 'app_settings', 'onedrive'), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fsLoadDropboxSettings(): Promise<DropboxCloudSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'app_settings', 'onedrive'));
    if (!snap.exists()) return null;
    return snap.data() as DropboxCloudSettings;
  } catch { return null; }
}
