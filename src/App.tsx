import { useEffect, useState } from 'react';
import { categoryColor } from './classify';
import { ClassificationResult, TICKET_CATEGORIES, Ticket } from './types';

const PRESETS: { label: string; from: string; subject: string; body: string }[] = [
  {
    label: 'Tracking Numbers',
    from: 'ups@notifications.com',
    subject: 'Your shipment is in transit',
    body: 'Track your package with this tracking number: 1Z999AA10123456784',
  },
  {
    label: 'UPS Delivery',
    from: 'noreply@ups.com',
    subject: 'UPS Delivery Notification',
    body: 'Your package is arriving today between 2-6 PM.',
  },
  {
    label: 'Tech Support',
    from: 'customer@example.com',
    subject: 'Broken closer — photo attached',
    body: 'Please see the attached picture. The arm is damaged and not working.',
  },
  {
    label: 'Quote',
    from: 'contractor@example.com',
    subject: 'Quote request for 10 closers',
    body: 'Can you send a quote / estimate for LCN 4040XP units?',
  },
  {
    label: 'Walmart PO',
    from: 'walmart@vendors.com',
    subject: 'Walmart PO #88421',
    body: 'Please confirm receipt of this Walmart purchase order.',
  },
  {
    label: 'Vendor Statement',
    from: 'billing@allegion.com',
    subject: 'Vendor account statement',
    body: 'Attached is your supplier reconciliation for Q2.',
  },
];

export default function App() {
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState('');

  const loadTickets = async () => {
    const [ticketData, stats] = await Promise.all([
      fetch('/api/tickets').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]);
    setTickets(ticketData);
    setCategoryStats(stats);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const runClassify = async (payload?: { from: string; subject: string; body: string }) => {
    const data = payload ?? { from, subject, body };
    setClassifying(true);
    setError('');
    try {
      const res = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Classification failed');
      }
      const json = await res.json();
      setResult({
        category: json.category,
        source: json.source,
        confidence: json.confidence,
      });
      if (!payload) {
        setFrom(data.from);
        setSubject(data.subject);
        setBody(data.body);
      }
      await loadTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Classification failed');
    } finally {
      setClassifying(false);
    }
  };

  const loadPreset = (preset: typeof PRESETS[number]) => {
    setFrom(preset.from);
    setSubject(preset.subject);
    setBody(preset.body);
    runClassify(preset);
  };

  const filteredTickets = selectedCategory
    ? tickets.filter(t => t.category === selectedCategory)
    : tickets;

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 26, fontWeight: 700 }}>Nexus Email Classifier</h1>
        <p style={{ margin: 0, color: '#555', fontSize: 14 }}>
          Ollama primary · keyword rules fallback · 10 categories
        </p>
      </header>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: '1fr 1fr' }}>
        <section style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e4e4e7' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Test an email</h2>

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            From
            <input
              value={from}
              onChange={e => setFrom(e.target.value)}
              placeholder="customer@example.com"
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, border: '1px solid #d4d4d8' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Subject
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject line"
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, border: '1px solid #d4d4d8' }}
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
            Body (first 500 chars sent to Ollama)
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={5}
              placeholder="Email body text..."
              style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', borderRadius: 6, border: '1px solid #d4d4d8', resize: 'vertical' }}
            />
          </label>

          <button
            onClick={() => runClassify()}
            disabled={classifying}
            style={{
              padding: '8px 18px',
              borderRadius: 8,
              border: 'none',
              background: classifying ? '#a1a1aa' : '#1a1a2e',
              color: '#fff',
              cursor: classifying ? 'wait' : 'pointer',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {classifying ? 'Classifying…' : 'Classify'}
          </button>

          {error && <p style={{ margin: '12px 0 0', color: '#dc2626', fontSize: 13 }}>{error}</p>}

          <div style={{ marginTop: 20 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#71717a', fontWeight: 600 }}>QUICK PRESETS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  onClick={() => loadPreset(p)}
                  disabled={classifying}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 999,
                    border: '1px solid #d4d4d8',
                    background: '#fafafa',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section style={{ background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e4e4e7' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>Result</h2>

          {result ? (
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: categoryColor(result.category),
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 15,
                  marginBottom: 14,
                }}
              >
                {result.category}
              </div>
              <p style={{ margin: '0 0 6px', fontSize: 13 }}>
                <strong>Source:</strong>{' '}
                {result.source === 'ollama' ? '🤖 Ollama' : '⚙️ Keyword rules'}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#555' }}>
                Confidence: {Math.round(result.confidence * 100)}%
              </p>
            </div>
          ) : (
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: 14 }}>
              Enter email details and click Classify, or pick a preset.
            </p>
          )}
        </section>
      </div>

      {tickets.length > 0 && (
        <section style={{ marginTop: 24, background: '#fff', borderRadius: 12, padding: 20, border: '1px solid #e4e4e7' }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Classified tickets</h2>

          <div className="category-filters" style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedCategory(null)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ccc',
                background: !selectedCategory ? '#0066cc' : 'white',
                color: !selectedCategory ? 'white' : '#333',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                borderColor: !selectedCategory ? '#0066cc' : '#ccc',
              }}
            >
              All ({tickets.length})
            </button>
            {TICKET_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ccc',
                  background: selectedCategory === cat ? '#0066cc' : 'white',
                  color: selectedCategory === cat ? 'white' : '#333',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  borderColor: selectedCategory === cat ? '#0066cc' : '#ccc',
                }}
              >
                {cat}
                {categoryStats[cat] ? ` (${categoryStats[cat]})` : ''}
              </button>
            ))}
          </div>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {filteredTickets.map(ticket => (
              <li
                key={ticket.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>{ticket.id}</span>
                  {ticket.category && (
                    <span
                      className="category-badge"
                      title={`${ticket.classificationSource} (${Math.round((ticket.classificationConfidence ?? 0) * 100)}%)`}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: '#e3f2fd',
                        borderRadius: 3,
                        fontSize: 12,
                        color: '#0066cc',
                      }}
                    >
                      {ticket.category}{' '}
                      {ticket.classificationSource === 'ollama' ? '🤖' : '⚙️'}
                    </span>
                  )}
                  <span style={{ color: '#71717a', fontSize: 12 }}>{ticket.from}</span>
                </div>
                <div style={{ fontWeight: 500 }}>{ticket.subject || '(no subject)'}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
