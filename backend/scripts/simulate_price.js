// scripts/simulate_price.js
require('dotenv').config();
const db = require('../src/db');
const alertService = require('../src/services/alertService');

const mockPrice = parseFloat(process.argv[2]);

if (!mockPrice || isNaN(mockPrice)) {
    console.error('Usage: node scripts/simulate_price.js <price>');
    console.error('Example: node scripts/simulate_price.js 20000');
    process.exit(1);
}

async function run() {
    console.log(`--- SIMULATING PRICE: ₹${mockPrice} ---`);
    try {
        await alertService.evaluateAlerts(mockPrice);
        console.log('--- SIMULATION COMPLETE ---');
    } catch (e) {
        console.error('Simulation failed:', e);
    } finally {
        // Allow time for async notifications to fire if any (though they are awaited in service)
        setTimeout(() => process.exit(0), 1000);
    }
}

run();
