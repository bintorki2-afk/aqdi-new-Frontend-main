# Deep QA — Aqdi (عقدي) Frontend

Independent re-verification of `FRONTEND_FIXES_LOG.md` against a real run
(Next dev server + local Laravel backend at `http://127.0.0.1:8000/api/v2`,
Playwright/Chromium, Arabic locale, desktop 1280px and mobile 375px).
Screenshots: `qa-shots/`. This file is updated as the inspection progresses.

Legend: **PASS** verified OK · **FAIL→FIXED** bug found and fixed here ·
**NOTE** observation / not a frontend defect · **OPEN** still open.

## 1. Static checks

| Check | Result | Evidence |
|---|---|---|
| `npx tsc --noEmit` | PASS | exit 0 (before and after fixes) |
| ESLint on changed folders (`features/create-contract`, `create-property`, `requests`, `lib/api`, `app/(services)`) | PASS (0 errors, 6 pre-existing unused-import warnings) | `Info`, `toast`, `_source`, `PropertyHasAgentOption`, `EMPTY_MANUAL_NATIONAL_ADDRESS`, `payingLabel` |
| ar.json / en.json key parity | PASS | 1824 keys each, no key only in one file, no empty values |
| Literal `t("…")` keys resolve in messages (static scan of `features/app/components/lib`) | PASS | 0 missing |
| Raw dotted keys leaked into rendered pages (`createContract.*` etc.) | PASS | scanned every wizard screen text — none |

(sections 2–7 filled in below as they are run)

## 2. Wizard — sublease path (deed → tenant → unit(s) → finance → payment → success)

| Check | Result | Evidence |
|---|---|---|
| Intro → لنبدأ starts a contract (`POST /contract/start`), spinner on start button | PASS | `qa-shots/00-intro.png` |
| Deed step: all 10 deed types selectable; documents requested per type (see §3 table) | PASS | `qa-shots/02-deed-0..9.png` |
| Empty continue on every step → toast "يرجى إكمال جميع البيانات المطلوبة" + per-field "هذا الحقل مطلوب" (never silent) | PASS | `01b-deed-empty-errors.png`, `06b-tenant-errors.png`, `07b-unit-errors.png`, `09b-finance-errors.png` |
| Sublease: only the PDF upload is requested, no national address, owner step skipped (deed → tenant) | PASS | `05-sublease-deed.png` |
| Tenant (individual): letters stripped from id, phone forced to 05…, 10-digit checks | PASS | id `abc123`→`123`; `0123`→`0523` |
| **Phone paste of international form (`+966551234567`) truncated to `0551234`** | **FAIL→FIXED** | native `maxLength=10` cut the pasted value *before* the normalizer ran → incomplete number, "length" error. Removed the native `maxLength` from `create-contract-saudi-mobile-field.tsx` and `create-property-saudi-mobile-field.tsx` (normalizer already caps to 10 digits). |
| Units: 1 and 2 units, add/remove, extra-info accordion, meter toggles | PASS | `08-units-filled.png` |
| **Select dropdown near the bottom of the viewport opens fully off-screen (unreachable, body scroll is locked while open)** | **FAIL→FIXED** | Measured: listbox top 910px on a 900px viewport, `--radix-select-content-available-height: -16px` (`08-unit2-dropdown.png` before/after). Cause: `avoidCollisions={false}` on every wizard select. Removed it in 6 select components (`create-contract-form-select`, `create-contract-deed-type-select`, `create-property-form-select`, `create-property-deed-type-select`, `create-unit-form-select`, `manual-national-address-form`) so the list flips above the field when there is no room below. Same look otherwise. |
| **Finance step total (#27) showed "00" (fee 0) before step 6 was saved; payment screen then showed the same stale "00" for 60 s** | **FAIL→FIXED** | `finance-summary/{uuid}` prices the *saved* contract; before step 6 the backend fee is 0, and React Query `staleTime: 60s` re-used that value on the payment screen (pay button read "00 ر.س" while backend charged 249). Fixes: (a) step 5/6 submit hooks now invalidate `contract-finance-summary` / `contract-financial`; (b) the finance-step summary renders only once step 6 is saved and unchanged (`isFinanceSaved`), so any number shown there is the exact charged amount. Verified: payment 249 → back → finance shows 249; change to 2 years → payment 399 = backend 399 (`10b-finance-revisit.png`, `11b-payment-2y.png`). |
| **Edits after a step was saved were silently discarded (steps 1, 2, 4, 5, 6 early-returned when `step >= N`)** | **FAIL→FIXED** | e.g. change duration 1→2 years after visiting payment: `POST step6` never re-sent, backend kept 1 year while UI showed 2. Store setters now drop the stale `contractStepNData` whenever the corresponding draft data changes (deed files/manual entry/toggles → step1; address link/photo/manual → step2; tenant → step4; units/unit-mode → step5; finance → step6) and hooks 4/5/6 read the live store value at submit time. Verified: second `POST /contract/step6` with `duration_preset:"other", duration_years:2`. |
| VAT line shows "مجاناً" when vat = 0 | PASS | `11-payment.png` (label text still says "(15%)" — see Still open) |
| Lead POST fires on payment screen (`POST /leads` with `contract_uuid, contract_id, amount, contract_type, source:"web"`) | PASS (after fix) | proxy log |
| **Lead amount was the hard-coded fallback / stale cached total when the summary had not loaded yet** | **FAIL→FIXED** | fired on mount with `PAYMENT_BREAKDOWN` fallback or the cached pre-save total (249 while the charged amount was 399). Now waits until the finance summary is neither pending nor refetching; empty `name`/`phone` are omitted so the backend auto-fills them (contract §7). |
| Continue / pay buttons show spinner + "جاري الحفظ..." and are disabled while submitting (double-click on pay → one `GET /payment/{uuid}`) | PASS | proxy log: 1 payment init per uuid |
| Review-order dialog opens with all sections + edit links | PASS | `12-review-dialog.png` |
| Test-mode payment → redirect → `/payment/success/{uuid}` | **FAIL→FIXED** | The success (and error) page **crashed with a 500** ("Cannot read properties of null (reading '0')") because `/payment-content` returns `data: null` when no content is configured and `getPaymentContent` did `data[0]`. Guarded (array / single object / null). Verified `13-success.png`: "تم الدفع بنجاح · #uuid · 249". |

## 3. Wizard — every deed type (documents requested, owner branch, payload keys)

Real runs (proxy log of what the Next server actually POSTed to the API):

| Deed type | Documents requested on the deed step | Owner step | Step-1 keys sent | Result |
|---|---|---|---|---|
| صك إلكتروني (وزارة العدل) | صورة الصك (or manual entry) + national address | living owner (+ optional بوكالة) | `instrument_type=electronic_deed_from_the_ministry_of_justice, image_instrument` | PASS → tenant → … → payment |
| سجل عقاري إلكتروني | same | living owner | `electronic_tax_register, image_instrument` | PASS |
| صك ورقي | صورة من الصك الورقي (single) | living owner | `old_handwritten, image_instrument` | PASS |
| المالك متوفّى | صك الملكية + صك حصر الورثة + الوكالة الشرعية عن الورثة + (قاصر → وكالة الأولياء) | **وكيل الورثة only**: id, phone, DOB, mandatory "مستند صفة الوكيل / الناظر"; no living-owner fields; blocked without the document | `property_ownership_owner_are_deceased, image_instrument, Image_inheritance_certificate, copy_power_of_attorney_from_heirs_to_agent, copy_of_guardians_power_of_attorney_for_agent` → step3 `add_legal_agent_of_owner=1, property_owner_is_deceased=1, id_num/mobile/dob_of_property_owner_agent, copy_of_the_authorization_or_agency` | PASS (`14-deceased-*`, `15*-deceased-*`) |
| وقف | صورة الصك + شهادة تسجيل الوقف + صك النظارة + (أكثر من ناظر → وكالة) | **ناظر الوقف only**, same mandatory capacity document | `property_ownership_owner_is_endowment, image_instrument, copy_of_the_endowment_registration_certificate, copy_of_the_trusteeship_deed, is_multiple_trusteeship_deed_copy=1, copy_of_guardians_power_of_attorney_for_agent` → step3 `add_legal_agent_of_owner=1` (+agent keys, no `property_owner_is_deceased`) | PASS (`14-waqf-*`, `15*-waqf-*`) |
| ورقة مبايعة | صورة من ورقة المبايعة | living owner | `sale_agreement, image_instrument` | PASS |
| هيئة المدن الاقتصادية | صورة من وثيقة الهيئة | living owner | `economic_cities_authority_suspended, image_instrument` | PASS |
| حجة استحكام | صورة من حجة الاستحكام (single) | living owner | `strong_argument, image_instrument` | PASS |
| عقد إيجار من الباطن | PDF only, no national address | skipped (deed → tenant) | `sublease_agreement, image_instrument=<pdf>` | PASS |
| تجديد عقد إيجار | PDF + "نفس العنوان / تغيير العنوان" | skipped; tenant → "نفس الوحدة / تعديل الوحدة" → finance | `lease_renewal, image_instrument=<pdf>` (+ step2 only when address changed) | PASS, commercial total 349 (`16-…`, `17*-…`, `18-renewal-payment.png`) |
| Owner **بوكالة** (PoA) | — | shows PoA number + PoA date + PoA document; all required | step3: `name_owner, property_owner_id_num, property_owner_mobile, add_legal_agent_of_owner=1, id_num_of_property_owner_agent, mobile_of_property_owner_agent, agency_number_in_instrument_of_property_owner, agency_instrument_date_of_property_owner, copy_of_the_authorization_or_agency` | PASS (`04d-owner-agency-filled.png`) |
| Tenant **company** (+ agent) | — | unified record forced to `7xxxxxxxxx`, owner id/phone/DOB, PoA upload when "وكيل أو مفوض" | step4: `tenant_entity=institution, tenant_entity_unified_registry_number, authorization_type=agent_or_authorized_by_registry_owner, id_num/mobile_of_property_tenant_agent, copy_of_the_authorization_or_agency` | PASS (`06e-tenant-company-agent.png`) |
| Units ×2 | — | — | step5: `units:[{unit_type_id, unit_usage_id, unit_number, floor_number, unit_area, Services}] ×2` | PASS |
| Finance with الضمان / الغرامة / extra conditions (#7) | — | — | step6: `tenant_role_ids:[1,2,3], tenant_role_values:{"1":"5000","2":"100"}, Guarantee_amount:"5000", daily_fine:"100", other_conditions_list:[…], other_conditions:"…\n…", annual_rent_amount_for_the_unit, contract_term_in_years` / `duration_preset:"other", duration_years, duration_months` | PASS (`10e-finance-roles-conditions.png`; roles seeded locally as test data since the local DB had none) |
| Owner step: empty name / id / phone / PoA number / PoA date only turned red, no message | **FAIL→FIXED** (minor) | `04b-owner-errors.png` before; now every empty required field shows "هذا الحقل مطلوب" like the tenant step (`create-contract-owner-data-phase.tsx`, `create-contract-agent-data-phase.tsx`) |
| Step 1 "already submitted" compared the raw enum (`electronic_deed_from_the_ministry_of_justice`) with what the backend stores (`electronic`) → every revisit of the deed step re-uploaded the deed | **FAIL→FIXED** (minor) | now compared through `mapInstrumentTypeToDeedType` (`use-submit-contract-step1.ts`, store `setSelectedDeedType`) |
| Commercial units show commercial usages (#24) | PASS | options: تجاري، مكتبي، مطعم، عيادة، صالون |

## 4. Edge cases

| Check | Result | Evidence |
|---|---|---|
| Refresh on the deed step after upload + link, and on the owner step after filling | PASS | files rehydrated from the persisted draft ("تم الإرفاق"), link/name/phone restored, step kept (`19-deed-after-refresh.png`) |
| Back navigation from finance → unit phase, edit area 120→150, continue | PASS (after resubmission fix) | second `POST /contract/step5` carries `unit_area:150` |
| Payment → back → finance shows the saved total; editing hides it until re-saved | PASS | see §2 |
| **Deed type change kept stale uploads** (sublease PDF became the "صورة الصك" of an electronic deed; deceased inheritance files survived a switch to waqf) | **FAIL→FIXED** | `setSelectedDeedType` now clears every deed document / manual entry / toggles whenever the type actually changes (before: only when cleared to ""). Verified: persisted files 0 after switch. |
| Letters in id → stripped; bad phone `0123` → `0523`; phone `+966…` → `05…` (after fix); area `abc` → empty; huge area accepted as 15 digits | PASS / NOTE | backend validates ranges |
| **Rent amount > 15 digits mangled by float precision** ("99999999999999999999" → "100,000,000,000,000,000,000" and wrong words) | **FAIL→FIXED** (minor) | digits capped at 12 in `create-contract-rent-amount-field.tsx` |
| XSS strings in owner name / extra condition (`<img onerror>`, `<script>`) | PASS | sent as plain text, rendered escaped in the review dialog; `window.__xss` never set |
| Duplicate submit: double-click pay → one `GET /payment/{uuid}`; continue disabled while submitting | PASS | proxy log |
| RTL: `<html dir="rtl" lang="ar">`, all screens right-aligned | PASS | screenshots |
| Mobile 375px: intro, deed (deceased, manual address), owner (+agency), tenant (individual, company), unit (+extra info), finance (+roles), payment, review dialog — no horizontal overflow, buttons inside the viewport | PASS after fix | `qa-shots/m-*.png`; overflow scan per screen = none |
| **Payment action row overflowed at 375px** ("عودة" pushed off-screen; pay label cannot shrink) | **FAIL→FIXED** | row wraps on phones, pay button full-width below "عودة/حفظ" (`sm:` keeps the single row) — `create-contract-payment-navigation.tsx`, `m-08-payment.png` |
| Select list near viewport bottom (mobile, region select) opens visibly | PASS after fix | listbox 394–586 on a 740px viewport (`m-03b-select-open.png`) |
| Phone display normalization (05…) in create/review flows | PASS | review dialog shows `0551234567`; API stores `509876543`/`00966…` and #25 mappers normalize on requests pages (unit-checked below) |

## 5. Properties (عقاراتي) and auth

| Check | Result | Evidence |
|---|---|---|
| `/properties/create`: deed type (7 property types) → deed image + national address → `POST /realstate/step1` (`instrument_type, image_instrument, latitude, longitude, address_url`) | PASS | `31-property-deed-filled.png` |
| Owner step collects **full name**, id, phone, DOB (+ optional agent with PoA image); empty continue → toast + field errors | PASS | `32-property-owner.png`, `32b-property-owner-agent.png` |
| Refresh on the name/review step restores the draft | PASS | |
| Save with property name → `POST /realstate/step2` with `name_real_estate, name_owner, property_owner_id_num, property_owner_mobile, property_owner_dob_*, add_legal_agent_of_owner=1, id_num/mobile/dob_of_property_owner_agent, copy_of_the_authorization_or_agency` → success screen | PASS | `34-property-success.png` |
| `/properties/my-properties` lists the new property by name; add unit (`/properties/create-unit`) → "نجحت العملية" → units page shows it | PASS | `35-my-properties.png`, `36/37-create-unit*.png` |
| "إنشاء عقد سكني على هذه الوحدة" → `POST /contract/start` with `is_real:true, real_id, unit_ids` → wizard opens at the tenant step with owner + unit prefilled → finance → payment 249 → review dialog | PASS | `38-contract-from-unit.png`, `39-…-review.png` |
| Auth pages render: login, register, forgot-password, verify-otp, reset-password; no leaked keys | PASS | `40-auth-*.png` |
| Register validation (empty, bad phone `123`, short password) shows Arabic messages | PASS | `41-register-errors.png` |
| Register → `/verify-otp?phone=…&flow=register`; wrong code → "رمز التحقق غير صحيح، تبقى لديك 4 محاولات"; code from `sms_logs` accepted → `/login` | PASS | `42-otp-wrong.png`, `43-after-otp.png` |
| Login: empty/invalid → messages; wrong password → toast "خطأ في رقم الجوال أو كلمة المرور"; success → callback URL | PASS | |
| **Protected-route redirect dropped the query string** (`/create-contract?id=residential` → `/login?id=residential&callbackUrl=/create-contract`, so after login the user landed in the *commercial* flow) | **FAIL→FIXED** | `middleware.ts` now sends `callbackUrl=/create-contract?id=residential` (and no stray params); verified end-to-end after login. |
| Forgot password → OTP → reset (mismatch message "غير متطابقتين", success → `/login`); backend OTP cooldown surfaced as a toast ("يرجى الانتظار قبل طلب رمز تحقق جديد.") | PASS | `44-forgot.png`, `45-reset-done.png` |
| Requests page: paid contract shows "مكتمل · 249 ر.س" and **no** "complete your data" / pay prompt (#29); drafts show "مسودة (غير مكتمل)" + "دفع …" | PASS | `21-requests.png` |
| Requests details dialog renders (deed, tenant, unit, finance) | PASS | `22-request-details.png` |
| Phone normalization (#25): `toSaudiMobileInputValue("00966501234501") → 0501234501`, `"509876543" → 0509876543` (mappers in `features/requests/utils/*` use it) | PASS | code check |

## 6. API contract (`CONTRACT_CHANGES.md`) vs what the site really sends

Captured with a logging proxy between the Next server actions and the API.

| Endpoint | Keys observed | Contract | Result |
|---|---|---|---|
| `POST /contract/step1` | `id, instrument_type, image_instrument` (+ `image_instrument_from_the_front/back` when a type needs them; `Image_inheritance_certificate, copy_power_of_attorney_from_heirs_to_agent, copy_of_guardians_power_of_attorney_for_agent` for deceased; `copy_of_the_endowment_registration_certificate, copy_of_the_trusteeship_deed, is_multiple_trusteeship_deed_copy, copy_of_guardians_power_of_attorney_for_agent` for waqf; manual entry fields incl. `instrument_number`) | §3 step 1 | PASS |
| `POST /contract/step3` | `name_owner, property_owner_id_num, property_owner_mobile, property_owner_iban (when set), add_legal_agent_of_owner, id_num_of_property_owner_agent, mobile_of_property_owner_agent, agency_number_in_instrument_of_property_owner, agency_instrument_date_of_property_owner, copy_of_the_authorization_or_agency`; representative branch adds `property_owner_is_deceased=1` | §3 step 3 | PASS |
| `POST /contract/step6` | `annual_rent_amount_for_the_unit, contract_term_in_years` **or** `duration_preset:"other", duration_years, duration_months`, `other_conditions`, `other_conditions_list`, `tenant_role_ids`, `tenant_role_values`, `Guarantee_amount`, `daily_fine` | §3 step 6 | PASS (`deposit` not mapped — no distinct role classifier, as documented in the fixes log) |
| `GET /finance-summary/{uuid}` | reads `total_price`, `price_details.tax` (VAT 0 → "مجاناً") | §1 | PASS |
| `POST /leads` | `contract_uuid, contract_id, amount, contract_type, source:"web"` (+ `name`, `phone` 05… when the auth user is loaded) → 201 | §7 | PASS (after the amount-timing fix) |
| `GET /payment/{uuid}` → `payment_url` → hosted page; `lang=ar&locale=ar` appended (#41) | §2 | PASS |

## 7. Deployment config

| Check | Result |
|---|---|
| `.env.example` lists every `process.env.NEXT_PUBLIC_*` the code reads (`BASE_URL` + 8 Firebase keys incl. optional `MEASUREMENT_ID`, `VAPID_KEY`); `.gitignore` keeps it (`!.env.example`) | PASS |
| `vercel.json`: framework nextjs, `next build`, `npm install`, `.next`, region `fra1` | PASS |
| `DEPLOY.md`: Node 20, build-time nature of `NEXT_PUBLIC_*`, Vercel + self-hosted/cPanel (`server.js`) paths | PASS |
| `public/firebase-messaging-sw.js` hard-codes the Firebase config (service workers cannot read env) — gotcha documented in `DEPLOY.md` §"firebase-messaging-sw.js" | PASS (NOTE: it is a real project config; rotate/replace per environment by hand) |
| `next.config.ts`: security headers, 50 MB upload body limits for server actions + proxy | PASS |

## New bugs found & fixed (this pass)

| # | Severity | Bug | Fix (files) |
|---|---|---|---|
| 1 | **High** | Payment success/error page 500s after paying when `/payment-content` has no content (`data: null`) | `features/payment/services/get-payment-content.ts`, `types/payment-content.ts` |
| 2 | **High** | Edits after a step was saved were silently discarded (steps 1, 2, 4, 5, 6 skipped resubmission) — e.g. changed duration never reached the backend | store setters drop stale `contractStepNData` on change; hooks 4/5/6 read live store (`use-create-contract-draft-store.ts`, `use-submit-contract-step{4,5,6}.ts`) |
| 3 | **High** | Finance-step total (#27) showed "00" before step 6 was saved and the payment screen reused that stale cached value (`staleTime` 60 s) — pay button "00 ر.س" | invalidate finance queries after step 5/6; finance-step summary only when saved & unchanged (`use-submit-contract-step{5,6}.ts`, `create-contract-finance-step.tsx`) |
| 4 | **High** | Any select near the bottom of the viewport opened fully off-screen (unreachable; body scroll locked) — hits every phone user | removed `avoidCollisions={false}` in 6 select components |
| 5 | Medium | Payment action row overflowed at 375px ("عودة" off-screen) | `create-contract-payment-navigation.tsx` wraps on phones |
| 6 | Medium | Lead (CR2) fired with the hard-coded fallback / stale amount; empty `name`/`phone` sent as `""` | `create-contract-payment-step.tsx`, `services/post-contract-lead.ts` |
| 7 | Medium | Protected-route redirect lost the query → wrong contract type after login | `middleware.ts` |
| 8 | Medium | Pasted international phone (`+966…`) truncated by native `maxLength` before normalization | `create-contract-saudi-mobile-field.tsx`, `create-property-saudi-mobile-field.tsx` |
| 9 | Medium | Changing the deed type kept the previous type's uploads (e.g. sublease PDF reused as deed image) | store `setSelectedDeedType` |
| 10 | Low | Owner/agent required fields showed no text message when empty (only red border) | `create-contract-owner-data-phase.tsx`, `create-contract-agent-data-phase.tsx` |
| 11 | Low | Step-1 "already submitted" compared raw enum vs backend-normalized value → re-upload on every revisit | `use-submit-contract-step1.ts`, store |
| 12 | Low | Rent amount > 15 digits mangled by float precision | `create-contract-rent-amount-field.tsx` (12-digit cap) |

All fixes: `npx tsc --noEmit` exit 0; ESLint on every changed file exit 0; markup/styles untouched except the two responsive/positioning changes above.

## Still open (not fixed here)

| Item | Why left |
|---|---|
| VAT row label reads "ضريبة القيمة المضافة (15%)" while the amount is "مجاناً" (VAT rate is 0 per the contract) | label lives in `messages/*.json` (design copy); the API returns `vat_rate` — suggest making the "(15%)" part dynamic or removing it. |
| Finance step shows the grand total only once the finance data has been saved (i.e. on a revisit from the payment screen); before that no total is shown | the `finance-summary` endpoint prices the *saved* contract (fee 0 before step 6). Showing a live total before saving needs a preview endpoint that accepts the pending duration (or the per-period fee in the periods payload). |
| Review-order dialog: shows "صورة الصك الالكتروني" label for sublease/renewal PDFs, lists the empty living-owner section for deceased/waqf (already noted in the fixes log), and an empty "رابط موقع العقار" for contracts started from a saved property | cosmetic, review-only |
| `/verify-otp` opened directly (no `phone` param) shows the placeholder number from `messages.*.verifyOtp.defaultPhone` | cosmetic |
| Units link from "my properties" carries `contract_type=null` when the API gives no type (page falls back correctly) | cosmetic |
| Completed-contract details show "إجمالي الخدمات 325 ريال" (informational services, not charged) next to the paid total | backend-provided figure; may confuse users — product decision |
| Backend (out of scope): `property_owner_mobile` echoed without the leading 0 (`509876543`), lead `phone` stored as `00966…` when auto-filled, `/payment-content` returning `data: null`, periods payload has no price so the per-duration "رسوم التوثيق" chip is empty locally | frontend tolerates all of these |

## Environment restore

- `app/layout.tsx`: the temporary Google-Fonts stub used for the offline dev server was **removed**; the file is byte-identical to the original (`import { IBM_Plex_Sans_Arabic } from "next/font/google"` present on line 2, `IBM_Plex_Sans_Arabic({...})` on line 13).
- `.env.local` untouched (the logging proxy was injected via a shell env var only); `.next` removed; the Next dev server and the proxy were stopped.
- Test data added to the **local** backend DB only: three `tenant_roles` rows (ضمان / غرامة يومية / تأجير من الباطن) so #7 could be exercised; a few test contracts/properties/users.

## Totals

- Checks: 65 PASS (incl. re-verified fixes #30/#31, #4/#5, #7, #11, #9, #20, #24, #25, #29, #41, CR1, CR2, #3) · 13 FAIL→FIXED rows (12 distinct bugs) · 7 open (all cosmetic/product or backend-side).
