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

## Deployment

### Standalone tester (this repo)

Use this app to paste sample emails, run presets, and verify categories before or after Nexus changes.

**1. Clone and install**

```bash
git clone git@github.com:finishlinefocus-cmd/Email-Classifier.git
cd Email-Classifier
npm install
cp .env.example .env
```

**2. Configure `.env`**

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4003` | HTTP port (use `4003` if Nexus is on `4000`) |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API base URL |
| `OLLAMA_MODEL` | `email-classifier` | Model name for primary classification |

**3. Start Ollama (optional but recommended)**

```bash
ollama pull email-classifier
ollama serve
```

If Ollama is down, keyword rules still classify emails (lower confidence, `⚙️` source).

**4. Run**

```bash
npm run dev          # dev — http://localhost:4003
# or production build:
npm run build && npm start
```

**5. Verify**

```bash
curl http://localhost:4003/api/health
curl -X POST http://localhost:4003/api/classify \
  -H "Content-Type: application/json" \
  -d '{"subject":"UPS delivery update","body":"Your package 1Z999 has been delivered"}'
```

### Nexus production (Windows server)

Classification also runs inside **[Nexus-Support](https://github.com/finishlinefocus-cmd/nexus-support)** on IMAP sync — no separate process required for live tickets.

**Deploy checklist on the Windows box:**

1. Pull latest Nexus: `git pull` in `Nexus-Support-Trimmed`
2. Install deps and restart: `npm install && npm run dev` (or your production start command)
3. On the same host, start Ollama and pull the model:
   ```bash
   ollama pull email-classifier
   ollama serve
   ```
4. Backfill uncategorized tickets (once after upgrade):
   ```bash
   curl -X POST http://192.168.1.188:4000/api/admin/backfill-categories \
     -H "Content-Type: application/json" \
     -d '{"force": true}'
   ```
5. Confirm new inbound mail gets a category badge (`🤖` Ollama or `⚙️` rules) in the Nexus UI.

**Ports**

| Service | Port |
|---|---|
| Nexus Support | `4000` |
| Standalone tester | `4003` |
| Ollama | `11434` |

Point Nexus nav to `http://<server-ip>:4003` when you want a quick link to this tester from production.

## Other folders (paused)

| Folder | Status |
|---|---|
| `voice-claude-server/` | Paused — VCMA voice MVP |
| `vcma/` | Paused — earlier prototype |
