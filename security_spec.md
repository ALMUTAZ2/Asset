# Security Specification — Maintenance & Emergency Invoices Platform

## Operational Context
Per user decision, the platform retains its dual-mode portal login (Company Employee ID + SHA-256 hashed password, and Contractor Name + PIN) without Google Sign-In. Accordingly, Firestore security rules enforce strict **Schema Integrity, Field Allowlisting, Immutable Core Identifiers, Primary Admin Protection (`100889`), Bounded String/Array Sizes, Append-Only Audit Logs, and Secret Exclusion** (OneDrive `accessToken` is strictly prohibited from Firestore).

## Data Invariants
1. **Primary Admin Protection**: Staff document `staff_users/100889` cannot be deleted and its `role` cannot be downgraded from `'admin'`.
2. **Staff Role Enumeration**: `role` must strictly be one of `['admin', 'reviewer', 'viewer']`.
3. **Immutable Keys**: On `staff_users` updates, `username` and `id` cannot change; on `contractors` updates, `id` cannot change; on `invoices` updates, `id` cannot change.
4. **Shadow Field Rejection**: Every `create` uses `hasAll([...]) && hasOnly([...])` and every `update` uses `affectedKeys().hasOnly([...])` plus `isValid[Entity](incoming())`.
5. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
6. **Invoice Status Enumeration & Bounded Photos**: Invoice `status` must strictly belong to `['معتمد', 'قيد المراجعة', 'ملاحظات معلقة', 'مرفوض']` and `photos.size() <= 8`.
7. **Append-Only Audit Logs**: `audit_logs` documents can only be created and read; `update` and `delete` are permanently denied.
8. **Idempotent Seed Lock**: `system_meta/seed_state` can be created once with `seeded == true` and never overwritten or deleted.
9. **Secret Exclusion**: `app_settings/onedrive` rejects any `accessToken` field via `hasOnly(['clientId', 'tenantId', 'baseFolder', 'connectedUser', 'updatedAt'])`.

## Dirty Dozen Adversarial Payloads (Must Fail)
1. **Shadow Field Injection on Staff**: `{ id: "st_99", name: "X", username: "999", passwordHash: "a".repeat(64), role: "viewer", updatedAt: "2026-11-19", isSuperAdmin: true }` -> DENIED.
2. **Invalid Role Escalation on Staff**: `{ ..., role: "superadmin" }` -> DENIED.
3. **Primary Admin Deletion**: `DELETE /staff_users/100889` -> DENIED.
4. **Primary Admin Role Downgrade**: `UPDATE /staff_users/100889 { role: "viewer", updatedAt: "..." }` -> DENIED.
5. **Document ID Poisoning**: `CREATE /staff_users/bad$id..with..spaces` -> DENIED.
6. **Oversized String DoW Attack**: `CREATE /invoices/inv_1` with `note` of 2,000 chars (>500 max) -> DENIED.
7. **Unbounded Photos Array**: `CREATE /invoices/inv_2` with 20 photo entries (>8 max) -> DENIED.
8. **Invalid Invoice Status**: `UPDATE /invoices/inv_1000 { status: "hacked" }` -> DENIED.
9. **Audit Log Tampering**: `UPDATE /audit_logs/log_1` or `DELETE /audit_logs/log_1` -> DENIED.
10. **OneDrive Secret Leakage**: `CREATE /app_settings/onedrive { ..., accessToken: "secret" }` -> DENIED.
11. **Seed State Overwrite**: `UPDATE /system_meta/seed_state { seeded: false }` -> DENIED.
12. **Type Poisoning on Contractor Active Flag**: `UPDATE /contractors/ctr_1 { active: "yes", updatedAt: "..." }` -> DENIED.
