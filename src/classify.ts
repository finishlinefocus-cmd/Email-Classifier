import { TICKET_CATEGORIES, TicketCategory } from './types';

const OLLAMA_PORT = 11434;
const OLLAMA_MODEL = 'email-classifier';
const OLLAMA_CONFIDENCE_THRESHOLD = 0.85;
const OLLAMA_TIMEOUT_MS = 5000;

interface OllamaResponse {
  response: string;
  done: boolean;
}

async function classifyWithOllama(
  subject: string,
  body: string
): Promise<{ category: TicketCategory; confidence: number } | null> {
  try {
    const prompt = `Classify this email into ONE of these 10 categories:
Tracking Numbers, Orders, UPS Delivery Notifications, Customer Pictures / Tech Support, Walmart Purchase Order Notifications, Invoices, Order Confirmations, Vendor Statements, Customer POs, or Quotes.

Subject: ${subject}
Body: ${body.slice(0, 500)}

Respond with ONLY the category name, nothing else.`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

    const response = await fetch(`http://localhost:${OLLAMA_PORT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('Ollama returned non-200 status:', response.status);
      return null;
    }

    const data: OllamaResponse = await response.json();
    const category = data.response.trim();

    if ((TICKET_CATEGORIES as readonly string[]).includes(category)) {
      return { category: category as TicketCategory, confidence: 0.9 };
    }

    console.warn('Ollama returned invalid category:', category);
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
  body: string
): Promise<{ category: TicketCategory; source: 'ollama' | 'rules'; confidence: number }> {
  const ollamaResult = await classifyWithOllama(subject, body);

  if (ollamaResult && ollamaResult.confidence >= OLLAMA_CONFIDENCE_THRESHOLD) {
    return {
      category: ollamaResult.category,
      source: 'ollama',
      confidence: ollamaResult.confidence,
    };
  }

  const keywordCategory = classifyWithKeywords(subject, body);
  return {
    category: keywordCategory,
    source: 'rules',
    confidence: 0.65,
  };
}

const CATEGORY_COLORS: Record<TicketCategory, string> = {
  'Tracking Numbers': '#0891b2',
  'Orders': '#16a34a',
  'UPS Delivery Notifications': '#7c3aed',
  'Customer Pictures / Tech Support': '#2563eb',
  'Walmart Purchase Order Notifications': '#db2777',
  'Invoices': '#ca8a04',
  'Order Confirmations': '#059669',
  'Vendor Statements': '#71717a',
  'Customer POs': '#ea580c',
  'Quotes': '#d97706',
};

export function categoryColor(category: TicketCategory): string {
  return CATEGORY_COLORS[category];
}
