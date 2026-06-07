import { classifyWithKeywords } from './classify';

const cases: { name: string; subject: string; body: string; expected: string }[] = [
  {
    name: 'tracking → Tracking Numbers',
    subject: 'Your tracking number',
    body: 'Shipment is in transit via FedEx',
    expected: 'Tracking Numbers',
  },
  {
    name: 'UPS delivery → UPS Delivery Notifications',
    subject: 'UPS Delivery Notification',
    body: 'Package arriving today',
    expected: 'UPS Delivery Notifications',
  },
  {
    name: 'invoice → Invoices',
    subject: 'Invoice #4421',
    body: 'Amount due by end of month',
    expected: 'Invoices',
  },
  {
    name: 'order confirm → Order Confirmations',
    subject: 'Order confirmation',
    body: 'Your order #9921 has been placed',
    expected: 'Order Confirmations',
  },
  {
    name: 'walmart PO → Walmart Purchase Order Notifications',
    subject: 'Walmart PO update',
    body: 'Please process this Walmart purchase order',
    expected: 'Walmart Purchase Order Notifications',
  },
  {
    name: 'customer PO → Customer POs',
    subject: 'Customer PO attached',
    body: 'Please see purchase order PO #1234',
    expected: 'Customer POs',
  },
  {
    name: 'quote → Quotes',
    subject: 'Quote request',
    body: 'Can you send an estimate for 5 units?',
    expected: 'Quotes',
  },
  {
    name: 'vendor statement → Vendor Statements',
    subject: 'Supplier statement',
    body: 'Vendor account reconciliation attached',
    expected: 'Vendor Statements',
  },
  {
    name: 'broken product → Customer Pictures / Tech Support',
    subject: 'Help with broken closer',
    body: 'See attached photo — not working',
    expected: 'Customer Pictures / Tech Support',
  },
  {
    name: 'generic order → Orders',
    subject: 'Need to place an order',
    body: 'We want to order 3 units',
    expected: 'Orders',
  },
];

let passed = 0;
for (const c of cases) {
  const result = classifyWithKeywords(c.subject, c.body);
  const ok = result === c.expected;
  console.log(`${ok ? '✓' : '✗'} ${c.name} → ${result} (expected ${c.expected})`);
  if (ok) passed++;
}
console.log(`\n${passed}/${cases.length} passed`);
process.exit(passed === cases.length ? 0 : 1);
