const { parseAndNormalizePrice, parseStockStatus } = require('../scraper/scraper');
const { db } = require('../config/supabase');

async function runTests() {
  console.log('==================================================');
  console.log('INE Price Tracker - Unit & Verification Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Unicode Price Normalization Tests
  console.log('--- Test 1: Price Normalization ---');
  assert(parseAndNormalizePrice('₹15,770') === 15770, 'Parses standard price ₹15,770');
  assert(parseAndNormalizePrice('₹\u200B1\u200B7\u200B,\u200B1\u200B0\u200B4') === 17104, 'Normalizes zero-width space price ₹17,104');
  assert(parseAndNormalizePrice('Member price ₹48,437') === 48437, 'Parses member price');
  assert(parseAndNormalizePrice('₹19,004\n₹17,104\n6% saving') === 17104, 'Selects final discounted price when MRP and sale price are present');
  assert(parseAndNormalizePrice('Invalid text') === null, 'Returns null for invalid price text');

  // 2. Stock Extraction Tests
  console.log('\n--- Test 2: Stock Extraction ---');
  assert(parseStockStatus('149 AVAILABLE') === '149 AVAILABLE', 'Parses "149 AVAILABLE"');
  assert(parseStockStatus('STOCK: 68 REMAINING') === 'STOCK: 68 REMAINING', 'Parses "STOCK: 68 REMAINING"');
  assert(parseStockStatus('LAST FEW: 36') === 'LAST FEW: 36', 'Parses "LAST FEW: 36"');
  assert(parseStockStatus('SOLD OUT') === 'SOLD OUT', 'Parses "SOLD OUT"');
  assert(parseStockStatus('READY TO SHIP · 149 AVAILABLE') === '149 AVAILABLE', 'Parses composite stock string');

  // 3. Database & Duplicate Tracking Tests
  console.log('\n--- Test 3: Database & Duplicate Tracking ---');
  const products = await db.getTrackedProducts();
  assert(Array.isArray(products) && products.length >= 3, 'Initial seed products loaded');

  try {
    // Attempt duplicate addition
    await db.addTrackedProduct({
      store_product_id: '2638',
      product_name: 'Junova Travel Router Nano',
      selected_option: '2-pack',
      product_url: 'https://demo.inelabteamdev.com/item/2638'
    });
    assert(false, 'Duplicate product prevention');
  } catch (err) {
    assert(err.message.includes('already being tracked'), 'Duplicate tracking prevented correctly');
  }

  // 4. Honest Log History Test
  console.log('\n--- Test 4: Honest Scrape Log Insertion ---');
  const historyEntry = await db.recordScrapeAttempt({
    tracked_product_id: 1,
    attempt_number: 1,
    price: null,
    stock: null,
    outcome: 'retried',
    error_message: 'Quote API returned HTTP 503'
  });
  assert(historyEntry.outcome === 'retried' && historyEntry.price === null && historyEntry.stock === null, 'Honest record inserted with null price/stock on retry');

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests };
