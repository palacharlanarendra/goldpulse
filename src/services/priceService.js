const axios = require('axios');
const cheerio = require('cheerio');
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

// disclaimer: Prices are indicative and informational only

// disclaimer: Prices are indicative and informational only

/**
 * Scrape gold price in USD/oz or USD/g from a public source
 * Returns price in USD per GRAM
 */
async function fetchGoldPriceUSD() {
    try {
        // Primary Source: GoldPrice.org (HTML)
        try {
            const url = 'https://goldprice.org/spot-gold.html';
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Referer': 'https://goldprice.org/'
                },
                timeout: 5000
            });

            const $ = cheerio.load(data);
            let priceText = $('span#formatted_price').text();
            if (!priceText) {
                const body = $('body').text();
                const match = body.match(/Gold Price.*?(\d{1,3}(?:,\d{3})*\.\d{2})/i);
                if (match) priceText = match[1];
            }

            if (priceText) {
                const price = parseFloat(priceText.replace(/,/g, ''));
                // Assuming price is per Ounce
                return price / 31.1035;
            }
        } catch (e) {
            console.log('Primary source failed, trying fallback...');
        }

        // Fallback Source 1: Bullion-Rates (HTML)
        try {
            const fallbackUrl = 'https://www.bullion-rates.com/gold/USD/spot-price.htm';
            const { data: data2 } = await axios.get(fallbackUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $2 = cheerio.load(data2);
            const body2 = $2('body').text();
            const matchFallback = body2.match(/Gold.*?(\d{1,3}(?:,\d{3})*\.\d{2})/i);
            if (matchFallback) {
                return parseFloat(matchFallback[1].replace(/,/g, '')) / 31.1035;
            }
        } catch (e) {
            console.log('Fallback 1 failed...');
        }

        // Fallback Source 2: GoldPrice.org Data API (JSON)
        try {
            const jsonUrl = 'https://data-asg.goldprice.org/dbXRates/USD';
            const { data: jsonData } = await axios.get(jsonUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            if (jsonData.items && jsonData.items.length > 0) {
                const item = jsonData.items[0];
                if (item.xauPrice) {
                    return item.xauPrice / 31.1035;
                }
            }
        } catch (e) {
            console.log('JSON source failed too.');
        }

        return null;

    } catch (error) {
        console.error('Error fetching gold price:', error.message);
        return null;
    }
}

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
 * Main orchestration function
 */
async function fetchAndStorePrice() {
    console.log('Running fetchAndStorePrice job...');

    const priceUSDPerGram = await fetchGoldPriceUSD();
    if (!priceUSDPerGram) {
        console.log('Failed to fetch gold price from all sources.');
        return;
    }

    const targetCurrency = 'INR'; // Default target
    const rate = await getExchangeRate('USD', targetCurrency);
    console.log(`Debug: Spot USD/g: ${priceUSDPerGram.toFixed(4)} | Rate: ${rate}`);

    // Convert to local currency
    let localPrice = priceUSDPerGram * rate;

    // Apply Digital Gold Premium
    // Default: 1.12 (12%) matching Indian Digital Gold standards
    const digitalGoldPremium = parseFloat(process.env.INR_DIGITAL_GOLD_PREMIUM || '1.12');

    if (targetCurrency === 'INR') {
        localPrice = localPrice * digitalGoldPremium;


    }

    // Create timestamp
    const now = new Date();

    // Store in DB
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

    // Update Cache
    latestPriceCache = {
        metal: 'gold',
        price: parseFloat(localPrice.toFixed(2)),
        currency: targetCurrency,
        price_type: 'digital_gold',
        updated_at: now.toISOString()
    };

    // Evaluate Alerts
    try {
        await alertService.evaluateAlerts(latestPriceCache.price);
    } catch (err) {
        console.error('Alert evaluation failed:', err);
    }
}

// Get from cache
function getLatestPrice() {
    return latestPriceCache;
}

module.exports = {
    fetchAndStorePrice,
    getLatestPrice
};
