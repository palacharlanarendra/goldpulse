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
// List of User-Agents to rotate
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

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
                    'User-Agent': getRandomUserAgent(),
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
            console.log('Primary source (GoldPrice.org) failed:', e.message);
        }

        // Fallback Source 1: Bullion-Rates (HTML)
        try {
            const fallbackUrl = 'https://www.bullion-rates.com/gold/USD/spot-price.htm';
            const { data: data2 } = await axios.get(fallbackUrl, {
                headers: {
                    'User-Agent': getRandomUserAgent()
                },
                timeout: 5000
            });
            const $2 = cheerio.load(data2);
            const body2 = $2('body').text();
            const matchFallback = body2.match(/Gold.*?(\d{1,3}(?:,\d{3})*\.\d{2})/i);
            if (matchFallback) {
                return parseFloat(matchFallback[1].replace(/,/g, '')) / 31.1035;
            }
        } catch (e) {
            console.log('Fallback 1 (Bullion-Rates) failed:', e.message);
        }

        // Fallback Source 2: GoldPrice.org Data API (JSON)
        try {
            const jsonUrl = 'https://data-asg.goldprice.org/dbXRates/USD';
            const { data: jsonData } = await axios.get(jsonUrl, {
                headers: {
                    'User-Agent': getRandomUserAgent()
                }
            });
            if (jsonData.items && jsonData.items.length > 0) {
                const item = jsonData.items[0];
                if (item.xauPrice) {
                    return item.xauPrice / 31.1035;
                }
            }
        } catch (e) {
            console.log('Fallback 2 (GoldPrice JSON) failed:', e.message);
        }

        // Fallback Source 3: LivePriceOfGold.com (HTML)
        try {
            const url3 = 'https://www.livepriceofgold.com/usa-gold-price.html';
            const { data: data3 } = await axios.get(url3, {
                headers: {
                    'User-Agent': getRandomUserAgent()
                },
                timeout: 5000
            });
            const $3 = cheerio.load(data3);
            // Select specific element if possible or regex body
            const body3 = $3('body').text();
            // Look for "Gold Price Per Ounce" ... number
            const match3 = body3.match(/Gold Price Per Ounce.*?(\d{1,3}(?:,\d{3})*\.\d{2})/i);
            if (match3) {
                return parseFloat(match3[1].replace(/,/g, '')) / 31.1035;
            }
        } catch (e) {
            console.log('Fallback 3 (LivePriceOfGold) failed:', e.message);
        }


        return null; // Return null to trigger INR fallback in main function

    } catch (error) {
        console.error('Error fetching gold price:', error.message);
        return null;
    }
}

/**
 * Scrape INR price directly from Google Search
 * "gold price today in india" usually gives 10g price or 1g price.
 */
async function fetchGoldPriceINR_Google() {
    try {
        console.log('Attempting to fetch INR price from Google Search...');
        const url = 'https://www.google.com/search?q=gold+price+today+in+india+per+gram';
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            timeout: 6000
        });

        // Regex to find price in INR. e.g. "₹ 6,500", "6,500.00", "7,200", "Rs 6500"

        const body = data;
        // Search for "₹" or "Rs" or "INR" followed by digits/commas
        const matches = [...body.matchAll(/(?:₹|Rs\.?|INR)\s?(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/gi)];

        let candidates = [];
        for (const m of matches) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val)) candidates.push(val);
        }

        if (candidates.length === 0) {
            console.log('Google Search: No currency matches found.');
            // Limit log size and check type
            const snippet = typeof body === 'string' ? body.substring(0, 500) : 'Body not string';
            console.log('Snippet dump:', snippet);
            return null;
        }

        // Calc: Heuristic to find best candidate.
        // 1g is likely 5000-9000. 10g is 50000-90000.
        // If we find a 10g price, divide by 10.

        for (const price of candidates) {
            if (price > 4000 && price < 10000) {
                console.log(`Found 1g price candidate: ${price}`);
                return price;
            }
            if (price > 40000 && price < 100000) {
                console.log(`Found 10g price candidate: ${price}. Converting to 1g.`);
                return price / 10;
            }
        }

        return null;

    } catch (e) {
        console.error('Google Search scrape failed:', e.message);
        return null;
    }
}

/**
 * Scrape INR price from GoodReturns.in (Backup)
 */
async function fetchGoldPriceINR_GoodReturns() {
    try {
        console.log('Attempting to fetch INR price from GoodReturns...');
        const url = 'https://www.goodreturns.in/gold-rates/india.html';
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent()
            },
            timeout: 6000
        });

        const $ = cheerio.load(data);
        const bodyText = $('body').text().replace(/\s+/g, ' ');

        // Regex: 24 Carat Gold ... 1 Gram ... ₹ 7,xxx
        const match = bodyText.match(/24 Carat Gold.*?1 Gram.*?₹\s*([\d,]+)/i);
        if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            console.log(`Found GoodReturns price: ${price}`);
            return price;
        }
        return null;
    } catch (e) {
        console.error('GoodReturns scrape failed:', e.message);
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
    const targetCurrency = 'INR';

    let priceUSDPerGram = await fetchGoldPriceUSD();
    let localPrice = null;

    if (priceUSDPerGram) {
        const rate = await getExchangeRate('USD', targetCurrency);
        console.log(`Debug: Spot USD/g: ${priceUSDPerGram.toFixed(4)} | Rate: ${rate}`);

        // Convert to local currency
        localPrice = priceUSDPerGram * rate;

        // Apply Digital Gold Premium (Only if derived from Spot USD)
        // Default: 1.12 (12%) matching Indian Digital Gold standards
        const digitalGoldPremium = parseFloat(process.env.INR_DIGITAL_GOLD_PREMIUM || '1.12');
        if (targetCurrency === 'INR') {
            localPrice = localPrice * digitalGoldPremium;
        }

    } else {
        // Fallback to INR-specific sources (Google)
        // Note: These usually include the premium/gst or are market rates, 
        // unlike Spot USD. We might NOT apply the premium again if it's "Market Price".
        // Let's assume Google gives market price (24k/22k). Ideally we want 24k.
        console.log('USD sources failed. Trying INR sources...');
        console.log('USD sources failed. Trying INR sources...');
        let inrPrice = await fetchGoldPriceINR_Google();
        if (!inrPrice) {
            inrPrice = await fetchGoldPriceINR_GoodReturns();
        }

        if (inrPrice) {
            localPrice = inrPrice;
            console.log(`Debug: INR Source price: ${localPrice}`);
        } else {
            console.log('All external sources failed. Unable to fetch price.');
            return; // Stop execution, do not save null/mock
        }
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
