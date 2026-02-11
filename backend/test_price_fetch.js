const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const priceService = require('./src/services/priceService');

(async () => {
    console.log('--- Starting Manual Price Fetch Test (API Mode) ---');
    try {
        await priceService.fetchAndStorePrice();
        console.log('--- Test Completed Successfully ---');
    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
    }
    process.exit(0);
})();
