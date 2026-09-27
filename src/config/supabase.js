const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[Supabase Config] Supabase client initialized successfully.');
  } catch (err) {
    console.error('[Supabase Config] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('[Supabase Config] SUPABASE_URL or SUPABASE_SECRET_KEY missing. In-memory fallback will be used if database operations are invoked without credentials.');
}

// In-memory fallback store for local development without Supabase keys
const fallbackState = {
  trackedProducts: [
    { id: 1, store_product_id: '2638', product_name: 'Junova Travel Router Nano', selected_option: '2-pack', product_url: 'https://demo.inelabteamdev.com/item/2638', created_at: new Date().toISOString() },
    { id: 2, store_product_id: '2305', product_name: 'Mosella Digital Piano Core', selected_option: 'Starter bundle', product_url: 'https://demo.inelabteamdev.com/item/2305', created_at: new Date().toISOString() },
    { id: 3, store_product_id: '2785', product_name: 'Pinecrest Digital Piano Aero', selected_option: 'Starter bundle', product_url: 'https://demo.inelabteamdev.com/item/2785', created_at: new Date().toISOString() }
  ],
  scrapeHistory: [],
  nextProductId: 4,
  nextHistoryId: 1
};

/**
 * High-level Database Helper API
 */
const db = {
  async getTrackedProducts() {
    if (supabase) {
      const { data, error } = await supabase.from('tracked_products').select('*').order('id', { ascending: true });
      if (error) throw new Error(`Supabase query error: ${error.message}`);
      return data;
    }
    return fallbackState.trackedProducts;
  },

  async getTrackedProductById(id) {
    const numId = Number(id);
    if (supabase) {
      const { data, error } = await supabase.from('tracked_products').select('*').eq('id', numId).single();
      if (error && error.code !== 'PGRST116') throw new Error(`Supabase query error: ${error.message}`);
      return data || null;
    }
    return fallbackState.trackedProducts.find(p => p.id === numId) || null;
  },

  async addTrackedProduct({ store_product_id, product_name, selected_option, product_url }) {
    if (supabase) {
      // Check for existing duplicate
      const { data: existing } = await supabase
        .from('tracked_products')
        .select('*')
        .eq('store_product_id', String(store_product_id))
        .eq('selected_option', selected_option)
        .single();

      if (existing) {
        throw new Error(`Product option "${selected_option}" is already being tracked.`);
      }

      const { data, error } = await supabase
        .from('tracked_products')
        .insert([{ store_product_id: String(store_product_id), product_name, selected_option, product_url }])
        .select()
        .single();

      if (error) throw new Error(`Supabase insert error: ${error.message}`);
      return data;
    }

    const existing = fallbackState.trackedProducts.find(
      p => String(p.store_product_id) === String(store_product_id) && p.selected_option === selected_option
    );
    if (existing) {
      throw new Error(`Product option "${selected_option}" is already being tracked.`);
    }

    const newProduct = {
      id: fallbackState.nextProductId++,
      store_product_id: String(store_product_id),
      product_name,
      selected_option,
      product_url,
      created_at: new Date().toISOString()
    };
    fallbackState.trackedProducts.push(newProduct);
    return newProduct;
  },

  async deleteTrackedProduct(id) {
    const numId = Number(id);
    if (supabase) {
      const { error } = await supabase.from('tracked_products').delete().eq('id', numId);
      if (error) throw new Error(`Supabase delete error: ${error.message}`);
      return true;
    }

    fallbackState.trackedProducts = fallbackState.trackedProducts.filter(p => p.id !== numId);
    fallbackState.scrapeHistory = fallbackState.scrapeHistory.filter(h => h.tracked_product_id !== numId);
    return true;
  },

  async recordScrapeAttempt({ tracked_product_id, attempt_number, price, stock, outcome, error_message }) {
    const numProductId = Number(tracked_product_id);
    const entry = {
      tracked_product_id: numProductId,
      attempt_number,
      scraped_at: new Date().toISOString(),
      price: price !== null && price !== undefined ? Number(price) : null,
      stock: stock || null,
      outcome, // 'success' | 'retried' | 'failed'
      error_message: error_message || null
    };

    if (supabase) {
      const { data, error } = await supabase.from('scrape_history').insert([entry]).select().single();
      if (error) throw new Error(`Supabase insert history error: ${error.message}`);
      return data;
    }

    const localEntry = { id: fallbackState.nextHistoryId++, ...entry };
    fallbackState.scrapeHistory.push(localEntry);
    return localEntry;
  },

  async getScrapeHistory(tracked_product_id) {
    const numId = Number(tracked_product_id);
    if (supabase) {
      const { data, error } = await supabase
        .from('scrape_history')
        .select('*')
        .eq('tracked_product_id', numId)
        .order('scraped_at', { ascending: true });
      if (error) throw new Error(`Supabase query history error: ${error.message}`);
      return data;
    }

    return fallbackState.scrapeHistory
      .filter(h => h.tracked_product_id === numId)
      .sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at));
  },

  async getAllScrapeHistory() {
    if (supabase) {
      const { data, error } = await supabase
        .from('tracked_products')
        .select(`
          id,
          store_product_id,
          product_name,
          selected_option,
          product_url,
          scrape_history (
            id,
            attempt_number,
            scraped_at,
            price,
            stock,
            outcome,
            error_message
          )
        `)
        .order('id', { ascending: true });

      if (error) throw new Error(`Supabase query export history error: ${error.message}`);
      return data;
    }

    return fallbackState.trackedProducts.map(p => ({
      ...p,
      scrape_history: fallbackState.scrapeHistory
        .filter(h => h.tracked_product_id === p.id)
        .sort((a, b) => new Date(a.scraped_at) - new Date(b.scraped_at))
    }));
  }
};

module.exports = { supabase, db };
