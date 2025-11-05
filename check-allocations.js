const cache = require('./src/backend/cache/portfolio-preview-periods.json');
const p20 = cache.periods['20'];
const keys = Object.keys(p20.allocations);

console.log('=== ALLOCATION DATA ANALYSIS ===\n');
console.log('Strategies with allocation data:', keys.length);
console.log('Strategy keys:', keys.join(', '), '\n');

keys.forEach(k => {
  const arr = p20.allocations[k];
  if (!arr || arr.length === 0) {
    console.log(k + ': NO DATA');
    return;
  }

  const mid = arr[Math.floor(arr.length/2)];
  const tickers = Object.keys(mid).filter(t => t !== 'date');
  const sum = tickers.reduce((s,t) => s + (mid[t]||0), 0);

  console.log(`${k}:`);
  console.log(`  - Data points: ${arr.length}`);
  console.log(`  - ETFs present: ${tickers.length} (${tickers.join(', ')})`);
  console.log(`  - Allocation sum: ${sum.toFixed(6)} (should be ~1.0)`);

  // Check if VNQ is present
  const hasVNQ = tickers.includes('VNQ');
  console.log(`  - Has VNQ: ${hasVNQ ? 'YES ✅' : 'NO ❌'}`);

  // Sample allocation values
  console.log(`  - Sample mid-point allocation:`, JSON.stringify(mid, null, 4));
  console.log('');
});
