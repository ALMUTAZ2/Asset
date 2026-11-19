import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export type StaffRole = 'admin' | 'reviewer' | 'viewer';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: StaffRole;
  updatedAt: string;
}

export interface ContractorRecord {
  id: string;
  name: string;
  pin: string;
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

export interface OneDriveCloudSettings {
  clientId: string;
  tenantId: string;
  baseFolder: string;
  connectedUser: string;
  updatedAt: string;
}

// ==================== PASSWORD HASHING (SHA-256) ====================
export async function hashPassword(plain: string): Promise<string> {
  const input = `sec_assets_v1:${plain}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoded = new TextEncoder().encode(input);
    const buf = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Deterministic hex fallback if SubtleCrypto unavailable in non-secure context
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, '0') +
    (h1 >>> 0).toString(16).padStart(8, '0') +
    '0000000000000000'
  );
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  const hashed = await hashPassword(plain);
  return hashed === storedHash;
}

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
    passwordHash: trunc(u.passwordHash, 128),
    role: VALID_ROLES.includes(u.role) ? u.role : 'reviewer',
    updatedAt: trunc(u.updatedAt || new Date().toISOString(), 64),
  };
}

export function sanitizeContractorPayload(c: ContractorRecord): ContractorRecord {
  const id = sanitizeId(c.id, 'ctr');
  return {
    id,
    name: trunc(c.name || 'مقاول', 150),
    pin: trunc(c.pin || '1234', 32),
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

export function sanitizeOneDriveSettings(s: OneDriveCloudSettings): OneDriveCloudSettings {
  return {
    clientId: trunc(s.clientId, 128),
    tenantId: trunc(s.tenantId || 'common', 128),
    baseFolder: trunc(s.baseFolder || '/فواتير_الصيانة_والطوارئ', 200),
    connectedUser: trunc(s.connectedUser, 150),
    updatedAt: trunc(s.updatedAt || new Date().toISOString(), 64),
  };
}

// ==================== BATCHED SEEDING (IDEMPOTENT) ====================
export interface SeedBundle {
  staffUsers: StaffUser[];
  contractors: ContractorRecord[];
  invoices: InvoiceRecord[];
  initialAudit: AuditLogRecord;
  oneDrive: OneDriveCloudSettings;
}

export async function ensureFirestoreSeeded(
  buildBundle: () => Promise<SeedBundle>,
  onProgress?: (msg: string) => void
): Promise<boolean> {
  const seedRef = doc(db, 'system_meta', 'seed_state');
  let alreadySeeded = false;
  try {
    const snap = await getDoc(seedRef);
    if (snap.exists() && snap.data()?.seeded === true) {
      alreadySeeded = true;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'system_meta/seed_state');
  }

  if (alreadySeeded) return false;

  // Double-check if staff_users already exist (e.g. concurrent tab started seeding)
  try {
    const existingStaff = await getDocs(query(collection(db, 'staff_users'), limit(1)));
    if (!existingStaff.empty) {
      try {
        await setDoc(seedRef, {
          seeded: true,
          version: 1,
          seededAt: new Date().toISOString(),
        });
      } catch {
        // Ignore if another tab created seed_state first
      }
      return false;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'staff_users');
  }

  onProgress?.('جاري ترحيل قاعدة بيانات المستخدمين والصلاحيات والفواتير إلى Firestore...');
  const bundle = await buildBundle();

  // Collect all write operations and commit in chunks of 350 (well below Firestore's 500-op batch cap)
  type PendingOp = { path: string; id: string; data: Record<string, unknown> };
  const ops: PendingOp[] = [];

  for (const u of bundle.staffUsers) {
    const clean = sanitizeStaffPayload(u);
    ops.push({ path: 'staff_users', id: clean.username, data: clean as unknown as Record<string, unknown> });
  }
  for (const c of bundle.contractors) {
    const clean = sanitizeContractorPayload(c);
    ops.push({ path: 'contractors', id: clean.id, data: clean as unknown as Record<string, unknown> });
  }
  for (const inv of bundle.invoices) {
    const clean = sanitizeInvoicePayload(inv);
    ops.push({ path: 'invoices', id: clean.id, data: clean as unknown as Record<string, unknown> });
  }
  const cleanLog = sanitizeAuditPayload(bundle.initialAudit);
  ops.push({ path: 'audit_logs', id: cleanLog.id, data: cleanLog as unknown as Record<string, unknown> });

  const cleanOd = sanitizeOneDriveSettings(bundle.oneDrive);
  ops.push({ path: 'app_settings', id: 'onedrive', data: cleanOd as unknown as Record<string, unknown> });

  const CHUNK_SIZE = 350;
  for (let i = 0; i < ops.length; i += CHUNK_SIZE) {
    const chunk = ops.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      batch.set(doc(db, op.path, op.id), op.data);
    }
    try {
      await batch.commit();
      const pct = Math.min(99, Math.round(((i + chunk.length) / ops.length) * 100));
      onProgress?.(`جاري مزامنة البيانات الأولية مع Firestore (${pct}%)...`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `seed_batch_${i}`);
    }
  }

  try {
    await setDoc(seedRef, {
      seeded: true,
      version: 1,
      seededAt: new Date().toISOString(),
    });
  } catch {
    // Another concurrent client may have already created seed_state
  }
  return true;
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

export function subscribeAllCollections(cbs: SubscriptionCallbacks): () => void {
  const unsubs: Unsubscribe[] = [];

  const safeErr = (err: unknown, op: OperationType, path: string) => {
    try {
      handleFirestoreError(err, op, path);
    } catch (wrapped) {
      cbs.onError(wrapped as Error);
    }
  };

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
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'contractors'), limit(500)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as ContractorRecord)
          .sort((a, b) => (a.id || '').localeCompare(b.id || '', undefined, { numeric: true }));
        cbs.onContractors(list);
      },
      (err) => safeErr(err, OperationType.LIST, 'contractors')
    )
  );

  unsubs.push(
    onSnapshot(
      query(collection(db, 'invoices'), limit(5000)),
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as InvoiceRecord)
          .sort((a, b) => {
            // Newest updated/created items on top for recently added ones, else preserve seq
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

  unsubs.push(
    onSnapshot(
      query(collection(db, 'audit_logs'), orderBy('createdAtMs', 'desc'), limit(60)),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as AuditLogRecord);
        cbs.onAuditLogs(list);
      },
      (err) => safeErr(err, OperationType.LIST, 'audit_logs')
    )
  );

  unsubs.push(
    onSnapshot(
      doc(db, 'app_settings', 'onedrive'),
      (snap) => {
        if (snap.exists()) {
          cbs.onOneDrive(snap.data() as OneDriveCloudSettings);
        }
      },
      (err) => safeErr(err, OperationType.GET, 'app_settings/onedrive')
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

// ==================== CRUD OPERATIONS ====================
export async function fsCreateStaffUser(user: StaffUser): Promise<void> {
  const clean = sanitizeStaffPayload(user);
  const path = `staff_users/${clean.username}`;
  try {
    await setDoc(doc(db, 'staff_users', clean.username), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fsUpdateStaffPassword(username: string, passwordHash: string): Promise<void> {
  const safeUser = sanitizeId(username);
  const path = `staff_users/${safeUser}`;
  try {
    await updateDoc(doc(db, 'staff_users', safeUser), {
      passwordHash: trunc(passwordHash, 128),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsUpdateStaffRole(username: string, role: StaffRole): Promise<void> {
  const safeUser = sanitizeId(username);
  const path = `staff_users/${safeUser}`;
  try {
    await updateDoc(doc(db, 'staff_users', safeUser), {
      role,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function fsDeleteStaffUser(username: string): Promise<void> {
  const safeUser = sanitizeId(username);
  const path = `staff_users/${safeUser}`;
  try {
    await deleteDoc(doc(db, 'staff_users', safeUser));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fsCreateContractor(c: ContractorRecord): Promise<void> {
  const clean = sanitizeContractorPayload(c);
  const path = `contractors/${clean.id}`;
  try {
    await setDoc(doc(db, 'contractors', clean.id), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fsUpdateContractorPin(id: string, pin: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `contractors/${safeId}`;
  try {
    await updateDoc(doc(db, 'contractors', safeId), {
      pin: trunc(pin, 32),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
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

export async function fsSaveOneDriveSettings(settings: OneDriveCloudSettings): Promise<void> {
  const clean = sanitizeOneDriveSettings(settings);
  const path = 'app_settings/onedrive';
  try {
    await setDoc(doc(db, 'app_settings', 'onedrive'), clean);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
