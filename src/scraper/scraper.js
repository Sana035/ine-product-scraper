const { chromium } = require('playwright');
const { handleCookies } = require('./cookieHandler');

function parseAndNormalizePrice(rawText) {
  if (!rawText) return null;

  const sanitized = rawText
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u00AD]/g, '')
    .trim();

  const rupeeMatches = sanitized.match(/₹\s*([\d,]+(?:\.\d{1,2})?)/g);
  let candidates = [];

  if (rupeeMatches && rupeeMatches.length > 0) {
    candidates = rupeeMatches.map(m => {
      const cleanNumStr = m.replace(/[^\d.]/g, '');
      return parseFloat(cleanNumStr);
    });
  } else {
    const allMatches = sanitized.match(/[\d,]+/g) || [];

    candidates = allMatches
      .map(m => parseFloat(m.replace(/,/g, '')))
      .filter(n => !isNaN(n) && n > 100);
  }

  const validPrices = candidates.filter(
    n => !isNaN(n) && n > 0
  );

  if (validPrices.length === 0) return null;

  return Math.min(...validPrices);
}

function parseStockStatus(rawText) {
  if (!rawText) return null;

  const sanitized = rawText
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const stockPatterns = [
    /SOLD OUT/i,
    /OUT OF STOCK/i,
    /LAST FEW:\s*\d+/i,
    /STOCK:\s*\d+\s*(?:REMAINING|AVAILABLE)?/i,
    /\d+\s*REMAINING/i,
    /\d+\s*AVAILABLE/i,
    /ONLY\s*\d+\s*LEFT/i,
    /\d+\s*LEFT/i,
    /IN STOCK/i,
    /AVAILABLE/i
  ];

  for (const pattern of stockPatterns) {
    const match = sanitized.match(pattern);

    if (match) {
      return match[0].toUpperCase();
    }
  }

  if (
    sanitized.includes('AVAILABLE') ||
    sanitized.includes('REMAINING') ||
    sanitized.includes('STOCK')
  ) {
    return sanitized
      .split('\n')[0]
      .toUpperCase()
      .slice(0, 50);
  }

  return null;
}

async function scrapeProduct({
  url,
  selectedOption,
  headed = true
}) {
  const isHeadless =
    process.env.HEADLESS === 'false'
      ? false
      : !headed;

  let browser = null;
  let context = null;
  let page = null;

  let quoteApiStatus = null;
  let quoteApiError = null;

  try {
    console.log(
      `[Scraper] Launching Chromium (headless: ${isHeadless})...`
    );

    browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    context = await browser.newContext({
      viewport: {
        width: 1280,
        height: 800
      },

      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    });

    page = await context.newPage();

    // --------------------------------
    // QUOTE API DIAGNOSTIC
    // --------------------------------

    page.on('response', async res => {
      const resUrl = res.url();

      if (resUrl.includes('/quote')) {
        quoteApiStatus = res.status();

        console.log(
          `[Scraper API Diagnostic] Quote API returned status HTTP ${quoteApiStatus}`
        );

        if (quoteApiStatus >= 400) {
          try {
            const errBody = await res.text();

            quoteApiError =
              `Quote API HTTP ${quoteApiStatus}: ${errBody.slice(0, 100)}`;
          } catch (e) {
            quoteApiError =
              `Quote API HTTP ${quoteApiStatus}`;
          }
        }
      }
    });

    // --------------------------------
    // OPEN PRODUCT PAGE
    // --------------------------------

    console.log(
      `[Scraper] Navigating to target URL: ${url}`
    );

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(1000);

    // Cookie handling is kept, but it is not the unlock mechanism.
    await handleCookies(page);

    // --------------------------------
    // OPTION SELECTION
    // --------------------------------

    if (selectedOption) {
      console.log(
        `[Scraper] Looking for product option chip "${selectedOption}"...`
      );

      const optionChip = page
        .locator(
          '.opt-picker button, button.opt-chip'
        )
        .filter({
          hasText: new RegExp(
            `^${selectedOption.trim()}$`,
            'i'
          )
        })
        .first();

      const chipExists =
        await optionChip.count().catch(() => 0);

      if (chipExists > 0) {
        console.log(
          `[Scraper] Selecting option variant "${selectedOption}"...`
        );

        await optionChip.click().catch(err => {
          console.warn(
            `[Scraper] Warning selecting option: ${err.message}`
          );
        });

        await page.waitForTimeout(800);
      } else {
        console.warn(
          `[Scraper] Option "${selectedOption}" chip not strictly found. Proceeding with active option.`
        );
      }
    }

    await handleCookies(page);

    // --------------------------------
    // OFFER PANEL
    // --------------------------------

    const offerPanel = page
      .locator(
        '.offer-panel, .price-card, main'
      )
      .first();

    const offerBox =
      await offerPanel.boundingBox().catch(() => null);

    if (!offerBox) {
      throw new Error(
        'Offer panel could not be located'
      );
    }

    const priceBtn = page
      .locator('button', {
        hasText: /check/i
      })
      .first();

    const priceBtnExists =
      await priceBtn.count().catch(() => 0);

    if (!priceBtnExists) {
      throw new Error(
        'Check price button could not be located'
      );
    }

    console.log(
      '[Scraper] Offer panel located. Performing bounded hover gesture sequence...'
    );

    // --------------------------------
    // HOVER / UNLOCK
    // --------------------------------

    for (let step = 0; step < 20; step++) {

      // First hover around the offer panel.
      const panelX =
        offerBox.x + offerBox.width / 2;

      const panelY =
        offerBox.y + offerBox.height / 2;

      await page.mouse.move(
        panelX,
        panelY
      );

      await page.waitForTimeout(150);

      // Also explicitly hover the price button.
      // This is important because the page says
      // the price unlocks when hovering the price area.
      await priceBtn.hover().catch(() => { });

      await page.waitForTimeout(150);

      const isDisabled =
        await priceBtn
          .isDisabled()
          .catch(() => true);

      if (!isDisabled) {
        console.log(
          `[Scraper] Offer panel price button unlocked at step ${step}!`
        );

        break;
      }

      // Move slightly around the price area.
      const offsets = [
        [0, -25],
        [25, 0],
        [0, 25],
        [-25, 0]
      ];

      const [offsetX, offsetY] =
        offsets[step % offsets.length];

      await page.mouse.move(
        panelX + offsetX,
        panelY + offsetY
      );

      await page.waitForTimeout(150);
    }

    // --------------------------------
    // FINAL BUTTON CHECK
    // --------------------------------

    const btnDisabled =
      await priceBtn
        .isDisabled()
        .catch(() => true);

    if (btnDisabled) {
      console.warn(
        '[Scraper] Price button remained disabled after hover sequence.'
      );

      throw new Error(
        'Offer panel locked: Price button not unlocked'
      );
    }

    // --------------------------------
    // CLICK PRICE BUTTON
    // --------------------------------

    console.log(
      '[Scraper] Clicking "Check today\'s price" button...'
    );

    quoteApiStatus = null;
    quoteApiError = null;

    await priceBtn.click();

    // --------------------------------
    // WAIT FOR OFFER DATA
    // --------------------------------

    let waitTimer = 0;

    const maxWaitMs = 15000;
    const checkIntervalMs = 500;

    while (waitTimer < maxWaitMs) {

      if (
        quoteApiStatus !== null &&
        quoteApiStatus >= 400
      ) {
        throw new Error(
          quoteApiError ||
          `Quote API returned HTTP ${quoteApiStatus}`
        );
      }

      const panelText =
        await offerPanel
          .innerText()
          .catch(() => '');

      if (
        panelText.includes('₹') ||
        panelText.includes('AVAILABLE') ||
        panelText.includes('REMAINING') ||
        panelText.includes('STOCK') ||
        panelText.includes('SOLD OUT')
      ) {
        console.log(
          '[Scraper] Rendered offer data detected in DOM.'
        );

        break;
      }

      await page.waitForTimeout(
        checkIntervalMs
      );

      waitTimer += checkIntervalMs;
    }

    // --------------------------------
    // FINAL API CHECK
    // --------------------------------

    if (
      quoteApiStatus !== null &&
      quoteApiStatus >= 400
    ) {
      throw new Error(
        quoteApiError ||
        `Quote API returned HTTP ${quoteApiStatus}`
      );
    }

    // --------------------------------
    // EXTRACT DATA
    // --------------------------------

    const fullPanelText =
      await offerPanel
        .innerText()
        .catch(() => '');

    console.log(
      '[Scraper] Raw Offer Panel Text:\n',
      fullPanelText
    );

    const price =
      parseAndNormalizePrice(
        fullPanelText
      );

    const stock =
      parseStockStatus(
        fullPanelText
      );

    console.log(
      `[Scraper] Extraction Result -> Price: ${price}, Stock: "${stock}"`
    );

    // --------------------------------
    // VALIDATE PRICE
    // --------------------------------

    if (
      price === null ||
      price <= 0
    ) {
      throw new Error(
        'Price extraction failed: No valid positive price figure found in offer panel'
      );
    }

    // --------------------------------
    // VALIDATE STOCK
    // --------------------------------

    if (!stock) {
      throw new Error(
        'Stock extraction failed: No valid stock text found in offer panel'
      );
    }

    // --------------------------------
    // SUCCESS
    // --------------------------------

    return {
      success: true,
      price,
      stock
    };

  } catch (err) {

    console.error(
      `[Scraper Failure] ${err.message}`
    );

    return {
      success: false,
      error: err.message
    };

  } finally {

    if (page) {
      await page
        .close()
        .catch(() => { });
    }

    if (context) {
      await context
        .close()
        .catch(() => { });
    }

    if (browser) {
      await browser
        .close()
        .catch(() => { });
    }

    console.log(
      '[Scraper] Browser cleanup completed.'
    );
  }
}

module.exports = {
  scrapeProduct,
  parseAndNormalizePrice,
  parseStockStatus
};