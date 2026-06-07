import { TicketCategory } from './types';

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
