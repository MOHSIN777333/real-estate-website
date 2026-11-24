# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Lead PII Isolation**: Prospective seller contact details (`leads/{leadId}`) must never be readable, listable, updatable, or deletable by anonymous or non-admin users. Public visitors may only `create` a new lead with `status == 'new'`.
2. **Temporal Integrity**: All `createdAt` and `updatedAt` fields on `leads`, `listings`, and `siteSettings` must match `request.time`. `createdAt` is immutable on update.
3. **Strict Schema Enforcement**: Every write to `leads`, `listings`, and `siteSettings` must pass `hasAll` + `hasOnly` key checks and string `.size()` bounds to prevent shadow fields or Denial-of-Wallet payload bloat.
4. **Admin Verification**: Admin privileges require `request.auth != null && request.auth.token.email_verified == true` and either the bootstrapped owner email (`mohsinali031332@gmail.com`) or a matching document in `/admins/{uid}`.
5. **Path Hardening**: All single-document operations validate `isValidId()` (`^[a-zA-Z0-9_-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Lead Create**: Sending `{ ..., "isAdmin": true }` to `/leads/{id}` -> MUST fail `hasOnly`.
2. **Pre-Escalated Lead Status on Create**: Sending `{ ..., "status": "closed" }` as an unauthenticated visitor -> MUST fail `status == 'new'` check.
3. **Forged Timestamp on Lead Create**: Sending `{ ..., "createdAt": "2020-01-01T00:00:00Z" }` -> MUST fail `createdAt == request.time`.
4. **Unauthenticated PII Read/List**: Calling `getDoc` or `getDocs` on `/leads` without admin auth -> MUST fail with `PERMISSION_DENIED`.
5. **Unverified Admin Email Spoof**: Authenticated user with `email: 'mohsinali031332@gmail.com'` and `email_verified: false` reading `/leads` -> MUST fail `email_verified == true`.
6. **Non-Admin Lead Status Update**: Signed-in non-admin user trying to update `leads/{id}.status` -> MUST fail `isAdmin()`.
7. **Oversized String Payload (1MB Notes)**: Sending 10,000-character `notes` in `/leads/{id}` -> MUST fail `notes.size() <= 1000`.
8. **Unbounded Tags Array**: Sending 15 tags in `leads/{id}.tags` -> MUST fail `tags.size() <= 10`.
9. **Invalid Lead Email Format**: Sending `"not-an-email"` to `/leads/{id}` -> MUST fail email regex check.
10. **Unauthorized Listing Creation**: Non-admin attempting to create a fake listing in `/listings/{id}` -> MUST fail `isAdmin()`.
11. **Unauthorized Brand Defacement**: Non-admin attempting to overwrite `/siteSettings/brand` -> MUST fail `isAdmin()`.
12. **Document ID Poisoning**: Attempting to create `/leads/bad$id!withSpaces` -> MUST fail `isValidId(leadId)`.
