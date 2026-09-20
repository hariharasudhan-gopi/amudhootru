const pool = require('../db/pool');
const { sendInvoiceEmail } = require('../routes/emailService');
const { checkLowStockAndAlertAdmin } = require('./stockAlerts');

const DELIVERY_STATUS_TEXT = {
    0: 'Order Placed',
    1: 'Order Shipped',
    2: 'Out for Delivery',
    3: 'Delivered',
};

function getPaymentStatus(order) {
    const paymentSignature = String(order.paymentsignature || '').toLowerCase();
    const isCod = paymentSignature.startsWith('cash-on-delivery') || String(order.paymentid || '').startsWith('COD-');

    if (isCod) {
        const isCodPaid = paymentSignature === 'cash-on-delivery-paid';
        return isCodPaid ? 'Paid (COD Collected)' : 'Pending (Cash on Delivery)';
    }

    if (order.paymentid) {
        return 'Paid Online';
    }

    return 'Pending';
}

// Computes the unit price actually payable for a product, applying the privilege
// offer price (if the user qualifies) whenever it beats or matches the public offer.
function getEffectivePrice(productDetails, isPrivilegeUser) {
    const basePrice = Number(productDetails.price);
    const publicOfferPrice = productDetails.offerprice && Number(productDetails.offerprice) > 0 && Number(productDetails.offerprice) < basePrice
        ? Number(productDetails.offerprice)
        : null;
    const privilegeOfferPrice = isPrivilegeUser && productDetails.privilegeofferprice && Number(productDetails.privilegeofferprice) > 0 && Number(productDetails.privilegeofferprice) < basePrice
        ? Number(productDetails.privilegeofferprice)
        : null;
    if (privilegeOfferPrice !== null && (publicOfferPrice === null || privilegeOfferPrice <= publicOfferPrice)) {
        return privilegeOfferPrice;
    }
    return publicOfferPrice !== null ? publicOfferPrice : basePrice;
}

// Shared by both the online (Razorpay-verified) and COD checkout paths.
async function createOrder({ userId, usermail, isPrivilegeUser, products, deliveryAddress, paymentId, paymentSignature }) {
    const orderDate = new Date();

    const orderResult = await pool.query(
        'INSERT INTO ordermeta (userid, deliverystatus, deliveryaddress, dateoforder, paymentid, paymentsignature) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, 0, deliveryAddress, orderDate, paymentId, paymentSignature]
    );
    const orderId = orderResult.rows[0].id;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(orderId).padStart(6, '0')}`;

    await pool.query('UPDATE ordermeta SET invoiceid = $1 WHERE id = $2', [invoiceNumber, orderId]);

    const pricedProducts = [];

    for (const product of products) {
        const productBefore = await pool.query(
            'SELECT name, price, offerprice, privilegeofferprice, availablequantity, lowstockthreshold FROM productdetails WHERE code = $1',
            [product.productId]
        );
        if (productBefore.rows.length === 0) {
            const error = new Error(`Product with ID ${product.productId} not found`);
            error.code = 'PRODUCT_NOT_FOUND';
            throw error;
        }
        const productDetails = productBefore.rows[0];
        const quantity = product.quantity || 1;
        // Compute the price server-side (never trust a client-supplied price) so the
        // stored/invoiced amount always reflects the offer/privilege price actually applicable.
        const unitPrice = getEffectivePrice(productDetails, isPrivilegeUser);
        pricedProducts.push({ name: productDetails.name, quantity, price: unitPrice });

        await pool.query(
            'INSERT INTO orderdetails (productcode, userid, quantity, ordertype, invoiceid, price) VALUES ($1, $2, $3, $4, $5, $6)',
            [product.productId, userId, quantity, 1, invoiceNumber, unitPrice]
        );

        const previousQuantity = Number(productDetails.availablequantity ?? 0);
        const newQuantity = Math.max(previousQuantity - quantity, 0);

        // decrement stock; floor at 0 to prevent negative values
        await pool.query(
            'UPDATE productdetails SET availablequantity = GREATEST(availablequantity - $1, 0) WHERE code = $2',
            [quantity, product.productId]
        );

        await checkLowStockAndAlertAdmin({
            code: product.productId,
            name: productDetails.name,
            previousQuantity,
            newQuantity,
            threshold: productDetails.lowstockthreshold
        });
    }

    await pool.query(
        'DELETE FROM orderdetails WHERE userid = $1 AND ordertype = $2',
        [userId, 0]
    );

    await sendInvoiceEmail({
        customerName: usermail,
        customerEmail: usermail,
        products: pricedProducts.map((product) => ({
            name: product.name,
            quantity: product.quantity,
            price: product.price * product.quantity
        })),
        invoiceNumber,
        orderDate: new Date(),
        paymentStatus: paymentSignature === 'cash-on-delivery' ? 'Cash on Delivery' : 'Paid',
        subtotal: pricedProducts.reduce((sum, product) => sum + product.price * product.quantity, 0),
        tax: 0,
        shipping: 0,
        grandTotal: pricedProducts.reduce((sum, product) => sum + product.price * product.quantity, 0),
        supportEmail: process.env.SUPPORT_EMAIL || 'support@amudhootru.com'
    });

    return { orderId, invoiceNumber };
}

async function placeCODOrder({ userId, usermail, isPrivilegeUser, products, deliveryAddress }) {
    return createOrder({
        userId,
        usermail,
        isPrivilegeUser,
        products,
        deliveryAddress,
        paymentId: `COD-${Date.now()}`,
        paymentSignature: 'cash-on-delivery',
    });
}

// Matches the exact shape/behavior GET /orders/placed has always returned to the client.
function decorateOrderMeta(order) {
    const decorated = {
        ...order,
        deliverystatuscode: order.deliverystatus,
        deliverystatus: DELIVERY_STATUS_TEXT[order.deliverystatus] ?? order.deliverystatus,
    };
    decorated.iscodorder = String(order.paymentsignature || '').toLowerCase().startsWith('cash-on-delivery') || String(order.paymentid || '').startsWith('COD-');
    decorated.iscodpaid = String(order.paymentsignature || '').toLowerCase() === 'cash-on-delivery-paid';
    decorated.paymentstatus = getPaymentStatus(order);
    return decorated;
}

async function attachProductDetails(order, userId) {
    const orderDetailsResult = await pool.query('SELECT * FROM orderdetails WHERE invoiceid = $1', [order.invoiceid]);

    const products = await Promise.all(orderDetailsResult.rows.map(async (product) => {
        const productResult = await pool.query('SELECT * FROM productdetails WHERE code = $1', [product.productcode]);
        const reviewResult = await pool.query(
            'SELECT rating, reviewtext FROM productreviews WHERE userid = $1 AND productcode = $2 AND invoiceid = $3',
            [userId, product.productcode, order.invoiceid]
        );

        return {
            ...product,
            productname: productResult.rows[0]?.name,
            // Prefer the price actually paid at order time; fall back to the current
            // product price only for legacy orders placed before this was recorded.
            price: (product.price !== null && product.price !== undefined) ? Number(product.price) : Number(productResult.rows[0]?.price),
            unit: productResult.rows[0]?.unit || null,
            review: reviewResult.rows[0] || null
        };
    }));

    return { ...order, products };
}

async function getUserOrders(userId) {
    const result = await pool.query(
        'SELECT * FROM ordermeta WHERE userid = $1 AND deliverystatus != -1 ORDER BY dateoforder DESC',
        [userId]
    );
    const orders = result.rows.map(decorateOrderMeta);
    return Promise.all(orders.map((order) => attachProductDetails(order, userId)));
}

// New lookup — no single-order-by-id endpoint existed before the AI agent needed one.
// Always scoped to userId so a user can never fetch another user's order.
async function getOrderById(userId, orderId) {
    const trimmed = String(orderId).trim();
    const isNumeric = /^\d+$/.test(trimmed);

    const result = await pool.query(
        isNumeric
            ? 'SELECT * FROM ordermeta WHERE userid = $1 AND deliverystatus != -1 AND id = $2'
            : 'SELECT * FROM ordermeta WHERE userid = $1 AND deliverystatus != -1 AND invoiceid = $2',
        [userId, isNumeric ? Number(trimmed) : trimmed]
    );

    if (result.rows.length === 0) return null;
    return attachProductDetails(decorateOrderMeta(result.rows[0]), userId);
}

async function getLatestOrder(userId) {
    const result = await pool.query(
        'SELECT * FROM ordermeta WHERE userid = $1 AND deliverystatus != -1 ORDER BY dateoforder DESC LIMIT 1',
        [userId]
    );
    if (result.rows.length === 0) return null;
    return attachProductDetails(decorateOrderMeta(result.rows[0]), userId);
}

module.exports = {
    getEffectivePrice,
    getPaymentStatus,
    createOrder,
    placeCODOrder,
    getUserOrders,
    getOrderById,
    getLatestOrder,
    DELIVERY_STATUS_TEXT,
};
