# Nexus Email Classifier

**Priority project** — automatic 10-category email sorting for Nexus Support.

## Quick start

```bash
npm install
npm run dev    # http://localhost:4003
npm test       # 10/10 keyword rule tests
```

Open the UI, paste an email or use presets, see category + Ollama/rules source.

## Docs

- [PRD.md](./PRD.md) — full product requirements (start here)

## Production integration

Live in **`Nexus-Support-Trimmed`** — same classifier, runs on IMAP sync at port 4000.

```bash
# Nexus (separate folder)
cd ../Nexus-Support-Trimmed
npm run dev
```

## 10 categories

Tracking Numbers · Orders · UPS Delivery Notifications · Customer Pictures / Tech Support · Walmart Purchase Order Notifications · Invoices · Order Confirmations · Vendor Statements · Customer POs · Quotes

## Ollama setup (Windows server)

```bash
ollama pull email-classifier   # or fine-tuned model when ready
ollama serve                   # port 11434
```

Without Ollama, keyword rules handle everything automatically.

## Other folders (paused)

| Folder | Status |
|---|---|
| `voice-claude-server/` | Paused — VCMA voice MVP |
| `vcma/` | Paused — earlier prototype |
