/**
 * Cookie and Consent Dialog Handler
 * Dynamically detects and dismisses cookie consent dialogs on the mock store.
 */

/**
 * Handle cookie consent popups dynamically if present on the page.
 * @param {import('playwright').Page} page 
 * @returns {Promise<boolean>} Returns true if a banner was dismissed, false otherwise.
 */
async function handleCookies(page) {
  try {
    const knownConsentTexts = [
      /^ALLOW$/i,
      /^Accept$/i,
      /^Accept All$/i,
      /^Allow All$/i,
      /^I Accept$/i,
      /accept/i,
      /allow/i
    ];

    for (const pattern of knownConsentTexts) {
      const buttonLocator = page.locator('button').filter({ hasText: pattern }).first();
      const count = await buttonLocator.count().catch(() => 0);
      
      if (count > 0) {
        const isVisible = await buttonLocator.isVisible().catch(() => false);
        if (isVisible) {
          console.log(`[CookieHandler] Found cookie consent button matching "${pattern}". Dismissing...`);
          await buttonLocator.click({ force: true, timeout: 2000 }).catch(err => {
            console.warn(`[CookieHandler] Warning clicking cookie button: ${err.message}`);
          });
          await page.waitForTimeout(300);
          return true;
        }
      }
    }
  } catch (err) {
    console.warn(`[CookieHandler] Error during cookie detection: ${err.message}`);
  }
  return false;
}

module.exports = { handleCookies };
