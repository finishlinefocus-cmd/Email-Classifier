import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { checkOllamaHealth, classifyInboundEmail, OLLAMA_CONFIG } from './src/classify';
import { TICKET_CATEGORIES, Ticket, TicketCategory } from './src/types';

const PORT = Number(process.env.PORT) || 4002;

const tickets: Ticket[] = [];
let nextId = 1001;

function generateId(): string {
  return `TIC-${nextId++}`;
}

function categoryStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const t of tickets) {
    if (t.category) {
      stats[t.category] = (stats[t.category] || 0) + 1;
    }
  }
  return stats;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    const ollama = await checkOllamaHealth();
    res.json({
      ok: true,
      port: PORT,
      ticketCount: tickets.length,
      ollama,
    });
  });

  app.get('/api/ollama/health', async (_req, res) => {
    res.json(await checkOllamaHealth());
  });

  app.get('/api/categories', (_req, res) => {
    res.json(categoryStats());
  });

  app.get('/api/tickets', (_req, res) => {
    res.json(tickets);
  });

  app.post('/api/classify', async (req, res) => {
    const { from = '', subject = '', body = '' } = req.body as {
      from?: string;
      subject?: string;
      body?: string;
    };

    if (!from && !subject && !body) {
      return res.status(400).json({ error: 'Provide at least one of: from, subject, body' });
    }

    const classification = await classifyInboundEmail(subject, body, from);

    const newTicket: Ticket = {
      id: generateId(),
      subject,
      from,
      body,
      category: classification.category,
      classificationSource: classification.source,
      classificationConfidence: classification.confidence,
      status: 'new',
      tags: ['Email', 'Auto-Sync'],
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };

    tickets.unshift(newTicket);
    res.json({ ...classification, ticket: newTicket });
  });

  app.get('/api/rules', (_req, res) => {
    res.json({
      categories: TICKET_CATEGORIES,
      ollama: OLLAMA_CONFIG,
      fallback: 'keyword rules (confidence 0.65)',
    });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist/client'));
    app.get('*', (_req, res) => {
      res.sendFile('index.html', { root: 'dist/client' });
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }

      try {
        const template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        vite.ssrFixStacktrace(err as Error);
        next(err);
      }
    });
  }

  app.listen(PORT, () => {
    console.log(`Email Classifier running at http://localhost:${PORT}`);
  });
}

startServer();
