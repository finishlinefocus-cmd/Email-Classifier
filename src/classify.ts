import { TICKET_CATEGORIES, TicketCategory } from './types';

export const OLLAMA_CONFIG = {
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'email-classifier',
  enabled: process.env.OLLAMA_ENABLED !== 'false',
  confidenceThreshold: Number(process.env.OLLAMA_CONFIDENCE_THRESHOLD) || 0.85,
  timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 30000,
};

const CLASSIFICATION_SYSTEM_PROMPT = `You classify inbound emails for Automatics and More support (automatic door hardware).

Pick EXACTLY ONE category from this list:
${TICKET_CATEGORIES.map(c => `- ${c}`).join('\n')}

Reply with ONLY the exact category name. No quotes, no punctuation, no explanation.`;

interface OllamaChatResponse {
  message?: { content?: string };
  done: boolean;
}

interface OllamaTagsResponse {
  models?: { name: string }[];
}

export interface OllamaHealth {
  enabled: boolean;
  reachable: boolean;
  modelInstalled: boolean;
  host: string;
  model: string;
  installedModels: string[];
  error?: string;
}

/** Map messy model output to a valid category name. */
export function normalizeOllamaCategory(raw: string): TicketCategory | null {
  const cleaned = raw
    .trim()
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\.$/, '')
    .trim();

  if ((TICKET_CATEGORIES as readonly string[]).includes(cleaned)) {
    return cleaned as TicketCategory;
  }

  const lower = cleaned.toLowerCase();
  for (const category of TICKET_CATEGORIES) {
    if (lower === category.toLowerCase()) {
      return category;
    }
  }

  for (const category of TICKET_CATEGORIES) {
    if (lower.includes(category.toLowerCase())) {
      return category;
    }
  }

  return null;
}

export async function checkOllamaHealth(): Promise<OllamaHealth> {
  const base: OllamaHealth = {
    enabled: OLLAMA_CONFIG.enabled,
    reachable: false,
    modelInstalled: false,
    host: OLLAMA_CONFIG.host,
    model: OLLAMA_CONFIG.model,
    installedModels: [],
  };

  if (!OLLAMA_CONFIG.enabled) {
    return base;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${OLLAMA_CONFIG.host}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ...base, error: `Ollama returned ${response.status}` };
    }

    const data: OllamaTagsResponse = await response.json();
    const installedModels = (data.models ?? []).map(m => m.name);
    const modelInstalled = installedModels.some(
      name => name === OLLAMA_CONFIG.model || name.startsWith(`${OLLAMA_CONFIG.model}:`)
    );

    return {
      ...base,
      reachable: true,
      modelInstalled,
      installedModels,
      error: modelInstalled ? undefined : `Model "${OLLAMA_CONFIG.model}" not installed`,
    };
  } catch (err) {
    return {
      ...base,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function classifyWithOllama(
  subject: string,
  body: string,
  from = ''
): Promise<{ category: TicketCategory; confidence: number; raw?: string } | null> {
  if (!OLLAMA_CONFIG.enabled) {
    return null;
  }

  try {
    const userContent = [
      from ? `From: ${from}` : '',
      `Subject: ${subject}`,
      `Body: ${body.slice(0, 500)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CONFIG.timeoutMs);

    const response = await fetch(`${OLLAMA_CONFIG.host}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_CONFIG.model,
        stream: false,
        keep_alive: '10m',
        options: {
          temperature: 0,
          num_predict: 48,
        },
        messages: [
          { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Ollama returned non-200 status:', response.status);
      return null;
    }

    const data: OllamaChatResponse = await response.json();
    const raw = (data.message?.content ?? '').trim();
    const category = normalizeOllamaCategory(raw);

    if (category) {
      return { category, confidence: 0.9, raw };
    }

    console.warn('Ollama returned invalid category:', raw);
    return null;
  } catch (err) {
    console.warn('Ollama classification failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
}

export function classifyWithKeywords(subject: string, body: string): TicketCategory {
  const combined = `${subject} ${body}`.toLowerCase();

  if (/tracking|shipment|delivered|in transit|ups tracking|fedex|usps|carrier/i.test(combined)) {
    return 'Tracking Numbers';
  }

  if (/ups|^ups delivery|package arriving|delivery notification/i.test(combined)) {
    return 'UPS Delivery Notifications';
  }

  if (/invoice|bill|amount due|payment due|account statement/i.test(combined)) {
    return 'Invoices';
  }

  if (/order.*confirm|confirmation.*order|order #|order.*placed/i.test(combined)) {
    return 'Order Confirmations';
  }

  if (/walmart|wal-mart|po.*walmart|walmart.*po/i.test(combined)) {
    return 'Walmart Purchase Order Notifications';
  }

  if (/purchase order|po #|po:|customer.*po|individual.*po/i.test(combined)) {
    return 'Customer POs';
  }

  if (/order|need to order|place.*order|want to order|quote.*price|pricing/i.test(combined)) {
    return 'Orders';
  }

  if (/quote|estimate|proposal|pricing/i.test(combined)) {
    return 'Quotes';
  }

  if (/vendor|supplier|statement|reconciliation|account balance/i.test(combined)) {
    return 'Vendor Statements';
  }

  if (/photo|picture|image|broken|damaged|issue|problem|help|support|not working/i.test(combined)) {
    return 'Customer Pictures / Tech Support';
  }

  return 'Orders';
}

export async function classifyInboundEmail(
  subject: string,
  body: string,
  from = ''
): Promise<{ category: TicketCategory; source: 'ollama' | 'rules'; confidence: number; ollamaRaw?: string }> {
  const ollamaResult = await classifyWithOllama(subject, body, from);

  if (ollamaResult && ollamaResult.confidence >= OLLAMA_CONFIG.confidenceThreshold) {
    return {
      category: ollamaResult.category,
      source: 'ollama',
      confidence: ollamaResult.confidence,
      ollamaRaw: ollamaResult.raw,
    };
  }

  const keywordCategory = classifyWithKeywords(subject, body);
  return {
    category: keywordCategory,
    source: 'rules',
    confidence: 0.65,
  };
}

export { categoryColor } from './categories';
