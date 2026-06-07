import { checkOllamaHealth, classifyInboundEmail } from '../src/classify';

const samples = [
  {
    name: 'UPS delivery',
    from: 'noreply@ups.com',
    subject: 'UPS Delivery Notification',
    body: 'Your package is arriving today between 2-6 PM.',
  },
  {
    name: 'Tech support photo',
    from: 'customer@example.com',
    subject: 'Broken closer — photo attached',
    body: 'Please see the attached picture. The arm is damaged and not working.',
  },
  {
    name: 'Walmart PO',
    from: 'walmart@vendors.com',
    subject: 'Walmart PO #88421',
    body: 'Please confirm receipt of this Walmart purchase order.',
  },
];

async function main() {
  const health = await checkOllamaHealth();
  console.log('Ollama health:', JSON.stringify(health, null, 2));

  if (!health.reachable) {
    console.error('\nOllama not reachable. Run: ollama serve');
    process.exit(1);
  }

  if (!health.modelInstalled) {
    console.error(`\nModel "${health.model}" not installed. Run: npm run ollama:create`);
    process.exit(1);
  }

  console.log('\nWarming up model (first call may take 30s)...');
  await classifyInboundEmail('warmup', 'ignore this email', 'test@example.com');

  console.log('Classifying samples...\n');

  let ollamaHits = 0;
  for (const sample of samples) {
    const result = await classifyInboundEmail(sample.subject, sample.body, sample.from);
    const icon = result.source === 'ollama' ? '🤖' : '⚙️';
    if (result.source === 'ollama') ollamaHits++;
    console.log(`${icon} ${sample.name}`);
    console.log(`   → ${result.category} (${Math.round(result.confidence * 100)}%, ${result.source})`);
    if (result.ollamaRaw) console.log(`   raw: ${result.ollamaRaw}`);
  }

  console.log(`\nOllama classified ${ollamaHits}/${samples.length} samples`);
  process.exit(ollamaHits > 0 ? 0 : 1);
}

main();
