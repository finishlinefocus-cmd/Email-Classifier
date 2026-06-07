# Nexus Email Classifier — PRD

**Project:** Automatics and More — Nexus Support  
**Priority:** #1 (active)  
**Author:** Sterling  
**Date:** June 2026  
**Standalone port:** 4003 · **Nexus integration:** `Nexus-Support-Trimmed`

---

## 1. Overview

When email syncs into Nexus (`cs@automaticsandmore.com`), each ticket is automatically tagged with one of **10 categories**. Agents filter the inbox by category pill. Classification is **Ollama primary** (`email-classifier` model) with **keyword rules fallback** — free, private, no cloud API.

---

## 2. Categories (10)

| Category | Examples |
|---|---|
| Tracking Numbers | FedEx/USPS tracking, shipment status |
| Orders | New orders, want to place order |
| UPS Delivery Notifications | UPS package arriving |
| Customer Pictures / Tech Support | Photos, broken, warranty, install help |
| Walmart Purchase Order Notifications | Walmart PO emails |
| Invoices | Bills, amount due |
| Order Confirmations | Order placed, confirmation |
| Vendor Statements | Supplier statements, reconciliation |
| Customer POs | Customer purchase orders |
| Quotes | Quote requests, estimates |

---

## 3. Classification Flow

```
1. Ollama (email-classifier @ :11434) — confidence ≥ 0.85 → use result 🤖
2. Keyword rules fallback — confidence 0.65 ⚙️
3. Default if rules miss: Orders
```

Keyword rules run in priority order: Tracking → UPS Delivery → Invoices → Order Confirmations → Walmart PO → Customer POs → Orders → Quotes → Vendor Statements → Tech Support.

---

## 4. Where It Lives

| Location | Role | Status |
|---|---|---|
| `email-classifier/` (this repo) | Standalone tester on :4003 | ✅ Built |
| `Nexus-Support-Trimmed/` | Production — IMAP sync + inbox UI | ✅ Pushed to GitHub |

**Nexus files:**
- `src/types.ts` — 10 categories + `classificationSource`
- `src/classify.ts` — Ollama + keyword engine
- `server.ts` — classify on IMAP ingest, backfill API
- `src/App.tsx` — filter pills + category badges

---

## 5. Standalone Tester (`email-classifier/`)

```bash
cd email-classifier
npm run dev          # http://localhost:4003
npm test             # 10/10 keyword tests
```

| Endpoint | Purpose |
|---|---|
| `POST /api/classify` | Classify email text |
| `GET /api/tickets` | History of test classifications |
| `GET /api/categories` | Count per category |
| `GET /api/rules` | Export rule config |

---

## 6. Nexus Deployment

```bash
cd Nexus-Support-Trimmed
npm run dev          # http://localhost:4000
```

**On Windows server:** pull latest, restart. Ollama must have `email-classifier` model on `:11434`.

**Backfill old tickets** (admin):
```bash
curl -X POST http://localhost:4000/api/admin/backfill-categories \
  -H 'Content-Type: application/json' \
  -d '{"force": true}'
```

---

## 7. Testing Checklist

- [ ] Tracking email → **Tracking Numbers**
- [ ] Installation help → **Customer Pictures / Tech Support**
- [ ] Price/quote question → **Quotes**
- [ ] `noreply@volusion.com` order → **Orders** or **Order Confirmations**
- [ ] Vendor domain → **Vendor Statements**
- [ ] Each filter pill shows only matching tickets
- [ ] Old tickets (no category) show under **All**
- [ ] Ollama down → keyword fallback still works ⚙️

---

## 8. Phase Roadmap

| Phase | Task | Status |
|---|---|---|
| **1** | 10 categories + keyword rules | ✅ Done |
| **1** | Nexus IMAP sync + filter pills | ✅ Done |
| **1** | Standalone tester :4003 | ✅ Done |
| **2** | Ollama `email-classifier` fine-tune with real emails | 🔲 Next |
| **2** | Nav button in Nexus → standalone :4003 | 🔲 Next |
| **2** | Override/correction UI to improve rules | 🔲 Planned |
| **3** | Export rules config Nexus imports | 🔲 Planned |

---

## 9. Deferred (not priority)

- Voice Claude Mobile Agent (`voice-claude-server/`) — paused
- VCMA prototype (`vcma/`) — paused

---

## 10. Success Criteria

- Joey, Ashley, Dillian each open their category pill and see only their ticket type
- New emails classified within seconds of IMAP sync
- No paid API calls for classification
- Standalone tool validates rules before changing Nexus production

---

*Email classifier is the active priority. Voice/VCMA work resumes after Phase 2 classifier is live.*
