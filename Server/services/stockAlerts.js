const pool = require('../db/pool');
const { sendLowStockAlertEmail, sendBackInStockEmail } = require('../routes/emailService');

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Alerts the admin the moment stock drops from above the threshold to at/below it (not on every subsequent decrement).
async function checkLowStockAndAlertAdmin({ code, name, previousQuantity, newQuantity, threshold }) {
    const effectiveThreshold = Number(threshold) || DEFAULT_LOW_STOCK_THRESHOLD;
    const crossedIntoLowStock = previousQuantity > effectiveThreshold && newQuantity <= effectiveThreshold;
    if (!crossedIntoLowStock) return;

    try {
        await sendLowStockAlertEmail({
            adminEmail: process.env.ADMIN_EMAIL,
            productCode: code,
            productName: name,
            availableQuantity: newQuantity,
            threshold: effectiveThreshold
        });
    } catch (error) {
        console.error('Failed to send low stock alert email:', error?.message || error);
    }
}

// Emails everyone who asked to be notified for this product, then clears their requests.
async function notifyBackInStock(code) {
    const pendingRequests = await pool.query(
        `SELECT od.invoiceid, ui.email AS useremail
         FROM orderdetails od
         JOIN userinfo ui ON ui.id = od.userid
         WHERE od.productcode = $1 AND od.ordertype = 2`,
        [code]
    );

    if (pendingRequests.rows.length === 0) return;

    const productResult = await pool.query('SELECT name FROM productdetails WHERE code = $1', [code]);
    const productName = productResult.rows[0]?.name || code;

    for (const request of pendingRequests.rows) {
        try {
            await sendBackInStockEmail({
                customerEmail: request.useremail,
                productName,
                supportEmail: process.env.SUPPORT_EMAIL || 'support@amudhootru.com'
            });
        } catch (error) {
            console.error('Failed to send back-in-stock email:', error?.message || error);
        }
    }

    const invoiceIds = pendingRequests.rows.map((request) => request.invoiceid).filter(Boolean);

    await pool.query('DELETE FROM orderdetails WHERE productcode = $1 AND ordertype = 2', [code]);
    if (invoiceIds.length > 0) {
        await pool.query('DELETE FROM ordermeta WHERE invoiceid = ANY($1::varchar[]) AND deliverystatus = -1', [invoiceIds]);
    }
}

module.exports = { checkLowStockAndAlertAdmin, notifyBackInStock, DEFAULT_LOW_STOCK_THRESHOLD };
