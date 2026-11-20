# Security Specification — Maintenance & Emergency Invoices Platform

## Operational Context
Per user decision, the platform retains its dual-mode portal login (Company Employee ID + password, and Contractor Name + PIN) without Google Sign-In. Firebase Auth custom tokens are issued only by server-side handlers after credential verification. Credential hashes live in a server-only Firestore collection, are upgraded to salted scrypt, and are never returned to browser clients. Firestore rules require an authenticated Firebase session and check current staff roles or contractor status before access. On the first production sign-in attempt, a fixed, idempotent server bootstrap publishes the rules for the named database and migrates legacy credentials. The same operation is available as `npm run security:apply` for controlled recovery after the updated deployment is active.

## Data Invariants
1. **Authentication Required**: Unauthenticated clients cannot read or write any Firestore collection.
2. **Private Credentials**: Password hashes and contractor PINs are moved to `auth_credentials`; browser rules deny this collection and login-attempt metadata.
3. **Live Role Checks**: Staff permissions use the current profile role; contractor access requires an active matching profile and is scoped to that contractor's invoices.
4. **Primary Admin Protection**: Staff document `staff_users/100889` cannot be deleted and its `role` cannot be downgraded from `'admin'`.
5. **Staff Role Enumeration**: `role` must strictly be one of `['admin', 'reviewer', 'viewer']`.
6. **Immutable Keys**: On `staff_users` updates, `username` and `id` cannot change; on `contractors` updates, `id` cannot change; on `invoices` updates, `id` cannot change.
7. **Shadow Field Rejection**: Every `create` uses `hasAll([...]) && hasOnly([...])` and every `update` uses `affectedKeys().hasOnly([...])` plus `isValid[Entity](incoming())`.
8. **Path Variable Hardening**: Every single-document operation (`get`, `create`, `update`, `delete`) enforces `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).
9. **Invoice Status Enumeration & Bounded Photos**: Invoice `status` must strictly belong to `['معتمد', 'قيد المراجعة', 'ملاحظات معلقة', 'مرفوض']` and `photos.size() <= 8`.
10. **Append-Only Audit Logs**: `audit_logs` documents can only be created and read; `update` and `delete` are permanently denied.
11. **Server-Only Metadata**: `system_meta`, `auth_credentials`, and login-rate-limit documents are inaccessible to browser clients.
12. **Secret Exclusion**: `app_settings/onedrive` rejects any `accessToken` field via `hasOnly(['clientId', 'tenantId', 'baseFolder', 'connectedUser', 'updatedAt'])`.

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
