// src/services/alertService.js
const db = require('../db');
const notificationService = require('./notificationService');

/**
 * Get or create a user by device token
 */
async function createOrGetUser(deviceToken) {
    if (!deviceToken) throw new Error('Device token required');

    // Check if exists
    const res = await db.query('SELECT id FROM users WHERE device_token = $1', [deviceToken]);
    if (res.rows.length > 0) {
        return res.rows[0].id;
    }

    // Create new
    const insertRes = await db.query(
        'INSERT INTO users (device_token) VALUES ($1) RETURNING id',
        [deviceToken]
    );
    return insertRes.rows[0].id;
}

/**
 * Create a new alert for a user
 * Rules: Only one active/untriggered alert per user allowed for simplicty as per reqs
 */
async function createAlert(userId, targetPrice, currentPrice) {
    // Check for existing active, untriggered alert with SAME target price
    const checkRes = await db.query(
        'SELECT id FROM alerts WHERE user_id = $1 AND target_price = $2 AND active = true AND triggered = false',
        [userId, targetPrice]
    );

    if (checkRes.rows.length > 0) {
        const error = new Error('Alert for this price already active');
        error.code = 'DUPLICATE_ALERT';
        throw error;
    }

    // Determine direction
    // If target > current, we wait for price to go ABOVE.
    // If target < current, we wait for price to go BELOW.
    // Default to BELOW if currentPrice is unknown (safety).
    let direction = 'BELOW';
    if (currentPrice && targetPrice > currentPrice) {
        direction = 'ABOVE';
    }

    // Create alert
    const insertRes = await db.query(
        `INSERT INTO alerts (user_id, metal, target_price, direction, active, triggered)
         VALUES ($1, 'gold', $2, $3, true, false)
         RETURNING metal, target_price, direction, active`,
        [userId, targetPrice, direction]
    );

    return insertRes.rows[0];
}

/**
 * Get all alerts for a user
 */
async function getUserAlerts(userId) {
    const res = await db.query(
        'SELECT target_price, triggered, created_at FROM alerts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return res.rows;
}

/**
 * Evaluate all active alerts against the latest price
 * Idempotent: Checks 'triggered' flag before inserting trigger log
 */
async function evaluateAlerts(latestPrice) {
    if (!latestPrice) return;

    console.log(`Evaluating alerts for price: ${latestPrice}`);

    // Find all eligible alerts
    // Modified to trigger for ANY price as requested
    const findQuery = `
        SELECT id, user_id, target_price, direction 
        FROM alerts 
        WHERE active = true 
          AND triggered = false 
          AND metal = 'gold'
    `;

    try {
        const { rows } = await db.query(findQuery); // No params needed now

        if (rows.length === 0) {
            console.log('No alerts triggered.');
            return;
        }

        console.log(`Triggering ${rows.length} alerts (ANY price)...`);

        // Process each alert
        for (const alert of rows) {
            let shouldTrigger = false;
            const target = parseFloat(alert.target_price);

            // LOGIC: Check direction
            if (alert.direction === 'ABOVE') {
                // Trigger if price rises AT or ABOVE target
                if (latestPrice >= target) {
                    shouldTrigger = true;
                }
            } else {
                // BELOW (Default)
                // Trigger if price drops AT or BELOW target
                if (latestPrice <= target) {
                    shouldTrigger = true;
                }
            }

            if (shouldTrigger) {
                // Mark as triggered FIRST
                const updateQuery = `
                    UPDATE alerts 
                    SET triggered = true, active = false 
                    WHERE id = $1 AND triggered = false
                    RETURNING id
                 `;
                const updateRes = await db.query(updateQuery, [alert.id]);

                if (updateRes.rows.length > 0) {
                    // Insert trigger log
                    await db.query(
                        'INSERT INTO alert_triggers (alert_id, triggered_price, triggered_at) VALUES ($1, $2, NOW())',
                        [alert.id, latestPrice]
                    );
                    console.log(`Alert ${alert.id} triggered! Target: ${target}, Current: ${latestPrice}`);

                    // Send Push Notification
                    try {
                        // Fetch device token
                        const userRes = await db.query('SELECT device_token FROM users WHERE id = $1', [alert.user_id]);
                        if (userRes.rows.length > 0) {
                            const deviceToken = userRes.rows[0].device_token;

                            await notificationService.sendAlertNotification(deviceToken, {
                                title: `🔔 Gold Alert: ₹${latestPrice.toFixed(2)}`,
                                body: `Your target of ₹${target} has been reached!`
                            });
                        }
                    } catch (notifErr) {
                        console.error('Notification failed:', notifErr);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Error evaluating alerts:', err);
    }
}

module.exports = {
    createOrGetUser,
    createAlert,
    getUserAlerts,
    evaluateAlerts
};
