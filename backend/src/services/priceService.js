const axios = require('axios');
const db = require('../db');
const alertService = require('./alertService');

// In-memory cache
let latestPriceCache = {
    price: null,
    currency: 'INR',
    price_type: 'digital_gold',
    updated_at: null
};

let exchangeRateCache = {
    rate: null,
    timestamp: 0
};

/**
 * Get exchange rate from USD to target currency
 */
async function getExchangeRate(from, to) {
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;

    // Return cached if valid
    if (exchangeRateCache.rate && (now - exchangeRateCache.timestamp < ONE_HOUR)) {
        return exchangeRateCache.rate;
    }

    try { // api.exchangerate-api.com
        const url = `https://api.exchangerate-api.com/v4/latest/${from}`;
        const { data } = await axios.get(url);
        const rate = data.rates[to];

        if (rate) {
            exchangeRateCache = {
                rate: rate,
                timestamp: now
            };
            return rate;
        }
    } catch (error) {
        console.error('Error fetching exchange rate:', error.message);
    }

    // Fallback
    return exchangeRateCache.rate || 83.0; // Default fallback (approx INR)
}

/**
 * Fetch Gold Price from Gold-API
 * Returns price in USD per Gram
 */
async function fetchGoldPriceAPI() {
    try {
        console.log('Fetching gold price from api.gold-api.com...');
        const url = 'https://api.gold-api.com/price/XAU';
        const { data } = await axios.get(url, { timeout: 10000 });

        // Response format: { "name": "Gold", "price": 2045.50, "symbol": "XAU", ... }
        // Price is in USD per Troy Ounce (XAU standard)

        if (data && data.price) {
            console.log(`API XAU Price: $${data.price}`);
            // Convert Ounce to Gram
            // 1 Troy Ounce = 31.1034768 grams
            const pricePerGram = data.price / 31.1035;
            return pricePerGram;
        }
    } catch (error) {
        console.error('Gold-API fetch failed:', error.message);
    }
    return null;
}

/**
 * Main orchestration function
 */
async function fetchAndStorePrice() {
    console.log('Running fetchAndStorePrice job...');
    const targetCurrency = 'INR';

    // 1. Fetch USD Price
    let priceUSDPerGram = await fetchGoldPriceAPI();

    if (!priceUSDPerGram) {
        console.error('Failed to fetch gold price from API. Aborting.');
        return;
    }

    // 2. Get Exchange Rate
    const rate = await getExchangeRate('USD', targetCurrency);
    console.log(`Debug: Spot USD/g: ${priceUSDPerGram.toFixed(4)} | Rate: ${rate}`);

    // 3. Convert to INR
    let localPrice = priceUSDPerGram * rate;

    // 4. Apply Premium (Digital Gold)
    // Default: 1.12 (12%) matching Indian Digital Gold standards
    if (targetCurrency === 'INR') {
        const digitalGoldPremium = parseFloat(process.env.INR_DIGITAL_GOLD_PREMIUM || '1.12');
        localPrice = localPrice * digitalGoldPremium;
    }

    // 5. Create timestamp
    const now = new Date();

    // 6. Store in DB
    try {
        const query = `
            INSERT INTO price_snapshots (metal, price, fetched_at)
            VALUES ($1, $2, $3)
            RETURNING id
        `;
        await db.query(query, ['gold', localPrice, now]);
        console.log(`Saved price: ${localPrice.toFixed(2)} ${targetCurrency}`);
    } catch (err) {
        console.error('DB Insert Error:', err.message);
    }

    // 7. Update Cache
    latestPriceCache = {
        metal: 'gold',
        price: parseFloat(localPrice.toFixed(2)),
        currency: targetCurrency,
        price_type: 'digital_gold',
        updated_at: now.toISOString()
    };

    // 8. Evaluate Alerts
    try {
        await alertService.evaluateAlerts(latestPriceCache.price);
    } catch (err) {
        console.error('Alert evaluation failed:', err);
    }
}

// Get from cache (Synchronous)
function getLatestPrice() {
    return latestPriceCache;
}

/**
 * Get current price, falling back to DB if cache is empty
 */
async function getCurrentPrice() {
    if (latestPriceCache.price) {
        return latestPriceCache.price;
    }

    try {
        const result = await db.query('SELECT price FROM price_snapshots ORDER BY fetched_at DESC LIMIT 1');
        if (result.rows.length > 0) {
            const price = parseFloat(result.rows[0].price);
            // Hydrate cache
            latestPriceCache.price = price;
            return price;
        }
    } catch (err) {
        console.error('DB Read Error in getCurrentPrice:', err);
    }
    return null;
}

module.exports = {
    fetchAndStorePrice,
    getLatestPrice,
    getCurrentPrice
};
