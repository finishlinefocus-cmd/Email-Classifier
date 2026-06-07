export const TICKET_CATEGORIES = [
  'Tracking Numbers',
  'Orders',
  'UPS Delivery Notifications',
  'Customer Pictures / Tech Support',
  'Walmart Purchase Order Notifications',
  'Invoices',
  'Order Confirmations',
  'Vendor Statements',
  'Customer POs',
  'Quotes',
] as const;

export type TicketCategory = typeof TICKET_CATEGORIES[number];

export type ClassificationSource = 'ollama' | 'rules' | 'manual';

export interface ClassificationResult {
  category: TicketCategory;
  source: ClassificationSource;
  confidence: number;
}

export interface Ticket {
  id: string;
  subject: string;
  from: string;
  body: string;
  category?: TicketCategory;
  classificationSource?: ClassificationSource;
  classificationConfidence?: number;
  status: string;
  tags: string[];
  priority: string;
  createdAt: string;
}
