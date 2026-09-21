# Frontend Fixes Log — Aqdi (عقدي) website

Surgical behavior/logic fixes only. Design/markup/styles preserved. TypeScript
compiles (`npx tsc --noEmit` clean). The production build only fails on Google
Fonts fetch (offline sandbox), which is unrelated to these changes.

Money is read from the finance endpoint keys (`fee`/`vat`/`total_price`); no fees
or VAT are computed or hard-coded on the client in the changed paths.

---

## #30 / #31 — Deceased-owner & Waqf: collect the legal representative — FIXED
For `deceased-owner` (وكيل الورثة) and `waqf-owner` (ناظر الوقف) deeds the owner
step now hides the living-owner fields and instead collects the representative
(id, birth date, phone) plus a **mandatory capacity document**. Wired to the
backend keys: `add_legal_agent_of_owner=1`, agent id/phone/DOB, the capacity
document via `copy_of_the_authorization_or_agency`, and `property_owner_is_deceased=1`
for the deceased path.
- `features/create-contract/hooks/use-create-contract-owner-step.ts` — derives
  `representativeMode` from the deed type (or resumed instrument type); requires
  only the representative's data to continue for these deeds.
- `features/create-contract/components/create-contract-owner-step.tsx` — renders
  the representative branch (reuses the agent phase with representative labels +
  capacity-document label; hides owner + normal-agent forms).
- `features/create-contract/components/create-contract-agent-data-phase.tsx` —
  `hidePoaFields` prop (representative collects a capacity doc, not a PoA number/date).
- `features/create-contract/utils/build-contract-step3-form-data.ts` — representative
  branch emits agent fields + `add_legal_agent_of_owner`/`property_owner_is_deceased`.
- `features/create-contract/hooks/use-submit-contract-step3.ts`,
  `services/submit-contract-step3.ts` — thread `representativeMode`.
- `types/owner-step.ts` — `isRepresentativeDataComplete`.
- Labels: `types/create-contract-labels.ts`, `app/(services)/create-contract/page.tsx`,
  `messages/ar.json`, `messages/en.json` (`owner.representative.*`).
- Note: the review-order dialog still lists the (empty) living-owner section for
  these deeds; data is sent correctly — the review display is cosmetic only.

## #4 / #5 — Owner full name + owner-by-agency (PoA) fields — FIXED
- Owner **full name** field added to the owner step and now required.
  `create-contract-owner-data-phase.tsx`; required in `types/owner-step.ts`
  (`isOwnerDataComplete`). `name_owner` is sent (already wired in the builder).
- بوكالة now also collects **PoA number** + **PoA date**, sent as
  `agency_number_in_instrument_of_property_owner` and
  `agency_instrument_date_of_property_owner`; the PoA document keeps going to
  `copy_of_the_authorization_or_agency`.
  `types/owner-step.ts` (AgentDataState + EMPTY), `create-contract-agent-data-phase.tsx`,
  `utils/build-contract-step3-form-data.ts`, store partialize, labels + messages.
- PoA number/date are required when بوكالة is on (owner-step hook).

## #7 — Guarantee / daily fine / extra condition (Step6) — FIXED
- Extra condition (الشرط الإضافي) already sent as `other_conditions_list`; also now
  sends joined `other_conditions`.
- الضمان (guarantee) and الغرامة (daily fine) tenant roles are mapped to the
  dedicated keys `Guarantee_amount` and `daily_fine` (in addition to
  `tenant_role_values`), classifying via existing role helpers.
- `utils/build-contract-step6-payload.ts`, `hooks/use-submit-contract-step6.ts`
  (passes the loaded tenant roles), `services/submit-contract-step6.ts`.
- Note: no distinct `deposit` role classifier exists, so `deposit` is not mapped
  separately (guarantee vs deposit aren't distinguishable from role metadata).

## #11 — "عقاراتي" create flow collects owner + deed — FIXED
- The standalone create-property flow already submits deed (step1) and owner
  (step2) data. The missing piece was the **owner full-name field** in the
  property owner phase, which is now shown and required (so `name_owner` is
  actually captured, not name-only).
- `features/create-property/components/create-property-owner-data-phase.tsx`,
  `features/create-property/types/owner-step.ts` (`isPropertyOwnerDataComplete`).

## #9 — Silent failure: error + success feedback — FIXED
- `lib/api/get-error-message.ts` now surfaces Laravel validation errors
  (`errors: { field: [...] }`), so backend validation reasons appear in toasts
  across every flow (contract steps, payment init, property, leads).
- Create/step/payment flows already toast `result.error`; terminal successes have
  feedback (draft-save dialog, property-save toast, property-update toast).

## #20 — Loading indicators on start/continue buttons — FIXED
- Spinner (`Loader2`) added while submitting: `create-contract-step-navigation.tsx`
  (continue), `create-contract-intro-step.tsx` (لنبدأ/start),
  `create-contract-payment-navigation.tsx` (pay).

## #24 — Usage label wrong for commercial units — FIXED
- The rented-unit phase defaulted `contractType` to `"housing"` when the session
  was missing, surfacing housing usages (e.g. السكن الجماعي) on commercial units.
  Now resolves from the session, then `contractStep1Data.contract_type`, then falls
  back. `create-contract-rented-unit-data-phase.tsx`.

## #25 — Phone format normalization (05XXXXXXXX) — FIXED
- Request details and completed-contract details now normalize owner/tenant
  phones (00966…/966…/+966… → 05XXXXXXXX) via `formatSaudiMobileForForm`.
  `features/requests/utils/map-contract-to-request-details.ts`,
  `features/requests/utils/map-completed-contract-to-details.ts`.
- Create/review flows already store/display 05 form.

## #27 — Financial step vs payment total mismatch — PARTIAL-NEEDS-REVIEW
- The payment summary/breakdown and the pay label already read the single-source
  `total_price` from the finance endpoint (`use-contract-finance-summary`); CR1
  also removed the method dialog that showed a second total. So the *payment*
  screen is single-source.
- Not reconciled: the finance **step's per-duration fee** is a base documentation
  fee from the periods endpoint (`parseContractPeriodLabel`), which is semantically
  a base fee, not the grand total (which adds meter/service fees). Showing the full
  finance-endpoint total on the finance step needs the contract far enough along;
  needs design/backend confirmation of intended number. Left unchanged.

## #29 — "complete required data" banner on completed screen — FIXED
- `isIncompleteDraft` now also requires the backend `is_draft` flag, so paid /
  in-progress / completed contracts never show the "complete your data" prompt.
  `features/requests/utils/map-contract-to-request-card.ts`.

## #41 — Moyasar gateway in English — FIXED (best-effort)
- The payment redirect URL now carries `lang=ar` and `locale=ar` before
  `window.location.assign`. `hooks/use-start-contract-payment.ts`.
- Note: the hosted gateway/invoice page is backend-generated; if Moyasar expects a
  different param or a server-side locale, backend coordination may be needed.

## #32 — Rented-unit step vs steps bar — PARTIAL-NEEDS-REVIEW
- The steps bar (`create-contract-stepper.tsx` / `CREATE_CONTRACT_STEPPER_STEPS`)
  already shows only intro · deed · owner · tenant · finance (+ payment); "بيانات
  الوحدة المؤجرة" is a sub-phase inside the tenant step, not a separate bar step —
  which already matches the intended design. Verified against the stepper, not a
  design file, so flagged for visual confirmation. No change made.

## CR1 — Direct payment (remove "how to receive" modal) — FIXED
- The primary pay action goes straight to payment (`pay-now`); the draft-before-pay
  method dialog is no longer opened. `hooks/use-contract-payment-method-flow.ts`
  (`handlePrimaryAction`), `create-contract-payment-step.tsx` (pay label always
  shows the amount). The dialog components remain rendered but unreachable.

## CR2 — Abandoned-payment lead capture — FIXED
- On payment-screen mount, POSTs to `/leads` with
  `{ name, phone (05…), contract_uuid, contract_id, amount, contract_type, source:"web" }`
  (name/phone from the authenticated user; idempotent server-side; a ref prevents
  duplicate fires per uuid).
  `features/create-contract/services/post-contract-lead.ts`,
  `features/create-contract/components/create-contract-payment-step.tsx`.

---

### Status summary
FIXED: #30/#31, #4/#5, #7, #11, #9, #20, #24, #25, #29, #41, CR1, CR2
PARTIAL-NEEDS-REVIEW: #27, #32

### Places where design intent was uncertain
- #27: whether the finance step should display the full finance-endpoint total
  (vs the per-duration base fee) — needs the intended number confirmed.
- #32: no design file available; the steps bar already excludes rented-unit as a
  separate step, so nothing was changed — needs a visual confirm.
- #41: the exact locale mechanism the Moyasar hosted page honors (URL param vs
  server-side) may need backend coordination.
- #7: `deposit` has no distinct tenant-role classifier, so only `Guarantee_amount`
  and `daily_fine` are mapped to dedicated keys.
- #30/#31: representative capacity document is sent via
  `copy_of_the_authorization_or_agency`; confirm the backend expects the وكيل/ناظر
  capacity document on that key (vs a dedicated key).

---

## Production readiness + open items resolved

Money is still read only from the finance endpoint (`total_price` / `tax` via the
`finance-summary` single source); no fees or VAT are computed on the client.
`npx tsc --noEmit` is clean; `npm run build` fails only on the offline Google
Fonts fetch (IBM Plex Sans Arabic), which is expected in the sandbox.

### #27 — Financial step vs payment total — RESOLVED
Two-part reconciliation so the number shown before paying equals the amount charged:
1. **Removed the misleading per-duration label.** The duration buttons showed the
   backend's per-period base documentation fee labeled **"إجمالي الرسوم" / "Total
   fees"**, which read as the grand total but excludes VAT/meter/service fees that
   the payment screen adds. Relabeled `finance.contractDuration.feeLabel` →
   **"رسوم التوثيق" / "Documentation fee"** so the small per-button number no
   longer masquerades as the total. (`messages/ar.json`, `messages/en.json`.)
2. **Show the authoritative grand total on the finance step.** The finance step now
   renders the *same* `CreateContractPaymentSummary` breakdown component the payment
   screen uses, reading the *same* single-source `finance-summary` endpoint
   (`total_price`, `tax`). It appears once the core finance selections are complete
   (`canContinue`), so the total shown on the finance step is produced by the exact
   same source/component as the payment screen — they cannot diverge.
   - `features/create-contract/components/create-contract-finance-step.tsx` (new
     `summaryLabels` prop; renders `CreateContractPaymentSummary` when `canContinue`).
   - `features/create-contract/components/create-contract-wizard.tsx` (passes
     `summaryLabels={labels.payment.summary}`).
   - Decision/limitation: the finance summary reflects the contract's persisted
     state; since both the finance step and the payment screen read the identical
     endpoint via React Query, any value shown is consistent between the two at the
     same point in time. The base per-period fee remains visible on the buttons but
     is now clearly labeled as a documentation fee, not the total.

### #32 — Steps bar vs rented-unit — CONFIRMED CORRECT (no change)
Verified against the code: the top-level stepper (`CREATE_CONTRACT_STEPPER_STEPS`)
renders only intro · deed · owner · tenant · finance (+ the EJAR payment pill).
"بيانات الوحدة المؤجرة" (rented-unit) is **phase index 1 inside the tenant step**,
driven by `CreateContractStepPhaseProgress` (a sub-progress within the tenant step)
in `create-contract-tenant-step.tsx` — a sub-phase of the tenant step, not a
separate top-level step. Labels/progress are consistent. This already matches the
intended design; nothing changed.

### #3 (flow robustness) — national-address "Google Maps link" — was a REAL friction, FIXED
Root issue: the link method's continue-gate (`canContinueNationalAddress`) only
checked `linkUrl.trim().length > 0` — so *any* text passed with **no validation and
no message**. Combined with the `type="url"` input, a malformed/scheme-less link
was accepted client-side and could then be rejected by the backend, and there was
no inline feedback explaining why. Hardened into an explicit, never-silent gate:
- Added `isValidNationalAddressLink()` — permissive: normalizes a missing scheme to
  `https://`, requires a dotted hostname and no whitespace, so every real Google
  Maps share URL passes (`maps.app.goo.gl/…`, `www.google.com/maps/…`, `goo.gl/…`)
  while plain text / non-URLs fail. (`features/create-contract/types/national-address.ts`.)
- `canContinueNationalAddress` link branch now uses it.
- The link field shows a **clear, live** error (`deed.nationalAddress.link.invalid`)
  the moment a non-empty value is not a valid URL — not only after pressing
  "متابعة" — so it can never silently block. Required-empty still shows on continue.
  (`create-contract-deed-national-address.tsx`, `create-contract-labels.ts`,
  `app/(services)/create-contract/page.tsx`, `messages/ar.json`, `messages/en.json`.)
- Note: the standalone **create-property** flow has its *own* permissive
  `canContinueNationalAddress` (non-empty check) and was intentionally left as-is —
  it does not silently block and hardening it there would need its own error-message
  wiring; out of scope for this task.

### #3 (representative step) — deceased/waqf — VERIFIED completable & submittable
Confirmed the وكيل الورثة / ناظر الوقف branch (from #30/#31) is reachable: the owner
step derives `representativeMode` from the deed/instrument type, `canContinue` uses
`isRepresentativeDataComplete` (id + birth date + phone + mandatory capacity
document), and `handleContinue` calls `submitStep3({ representativeMode })`. No
change needed.

### Production config — ADDED
- `.env.example` — every `NEXT_PUBLIC_*` the app reads, with a one-line comment and
  placeholder each: `NEXT_PUBLIC_BASE_URL`, all `NEXT_PUBLIC_FIREBASE_*`
  (`API_KEY`, `AUTH_DOMAIN`, `PROJECT_ID`, `STORAGE_BUCKET`, `MESSAGING_SENDER_ID`,
  `APP_ID`, optional `MEASUREMENT_ID`) and the Web Push `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
  `.gitignore` updated with `!.env.example` so the template is committed.
- `vercel.json` — framework `nextjs`, `next build` / `npm install`, region `fra1`.
- `DEPLOY.md` — Vercel deploy (env vars, Node 20, build command, custom domain) and
  non-Vercel deploy (`npm ci` → `npm run build` → `next start`, plus the cPanel /
  Passenger `server.js` path). Calls out that `NEXT_PUBLIC_*` are build-time (rebuild
  on change), that `public/firebase-messaging-sw.js` hardcodes the Firebase config
  and must be updated by hand, and where each Firebase value comes from in the console.

### Verification
- `npx tsc --noEmit`: clean (exit 0).
- `npm run build`: fails only on the offline Google Fonts fetch (IBM Plex Sans
  Arabic) as expected; no other type/build errors.

### Status summary (updated)
FIXED/RESOLVED: #30/#31, #4/#5, #7, #11, #9, #20, #24, #25, #29, #41, CR1, CR2, #27, #3 (address + representative)
CONFIRMED CORRECT: #32
