const express = require('express');
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const {
  sendInvoiceEmail,
    sendDeliveryEmail,
    sendPaymentSuccessEmail
} = require("./emailService");
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { checkLowStockAndAlertAdmin } = require('../services/stockAlerts');
const orderService = require('../services/orderService');

require("dotenv").config();
const pool = require('../db/pool');


// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_USER,
//     pass: process.env.GMAIL_APP_PASSWORD  // Gmail App Password (not regular password)
//   }
// });

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


const router = express.Router();

router.use(express.json());

// Step 1: Create a Razorpay order and return order_id to the client
router.post('/orders/create-payment', requireAuth, async function(req, res) {
    const { products } = req.body;

    try {
        let productsPrice = 0;
        const isPrivilegeUser = Boolean(req.user.isPrivilege);

        for (const product of products) {
            const productResult = await pool.query(
                'SELECT * FROM productdetails WHERE code = $1',
                [product.productId]
            );

            if (productResult.rows.length === 0) {
                return res.status(404).json({ message: `Product with ID ${product.productId} not found` });
            }

            const productDetails = productResult.rows[0];
            const effectivePrice = orderService.getEffectivePrice(productDetails, isPrivilegeUser);
            productsPrice += effectivePrice * (product.quantity || 1);
        }

        const options = {
            amount: productsPrice * 100, // amount in paise
            currency: "INR",
            receipt: "receipt_" + Date.now()
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // Return the order_id to the client to open Razorpay checkout
        res.status(200).json({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            razor_key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Step 2: Verify payment and place the order
// Client sends razorpay_order_id, razorpay_payment_id, razorpay_signature after checkout success
router.post('/orders/place', requireAuth, async function(req, res) {
    const {
        products,
        deliveryAddress,
        paymentMethod,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;
    const userId = req.user.userId;
    const usermail = req.user.email;

    try {
        const selectedPaymentMethod = paymentMethod === 'cod' ? 'cod' : 'online';

        let savedPaymentId = null;
        let savedPaymentSignature = null;
        if (selectedPaymentMethod === 'online') {
            // Verify the payment signature only for prepaid orders.
            const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generatedSignature = hmac.digest("hex");

            if (generatedSignature !== razorpay_signature) {
                return res.status(400).json({ message: 'Invalid payment signature' });
            }

            savedPaymentId = razorpay_payment_id;
            savedPaymentSignature = razorpay_signature;
        } else {
            savedPaymentId = `COD-${Date.now()}`;
            savedPaymentSignature = 'cash-on-delivery';
        }

        const isPrivilegeUser = Boolean(req.user.isPrivilege);

        const { orderId } = await orderService.createOrder({
            userId,
            usermail,
            isPrivilegeUser,
            products,
            deliveryAddress,
            paymentId: savedPaymentId,
            paymentSignature: savedPaymentSignature,
        });

        res.status(200).json({
            message: selectedPaymentMethod === 'cod'
                ? 'Order placed successfully with Cash on Delivery'
                : 'Order placed successfully',
            orderId: orderId
        });
    } catch (err) {
        if (err.code === 'PRODUCT_NOT_FOUND') {
            return res.status(404).json({ message: err.message });
        }
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/orders/placed', requireAuth, async function(req, res) {
    const userId = req.user.userId;

    try {
        const orders = await orderService.getUserOrders(userId);
        res.status(200).json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/orders/all', requireAdmin, async function(req, res) {
    const { status, dateFrom, dateTo } = req.query;

    try {
        let query = `SELECT om.*, ui.name AS username, ui.email AS useremail, (ui.profiletype = 2) AS isprivilegecustomer
                     FROM ordermeta om
                     LEFT JOIN userinfo ui ON ui.id = om.userid
                     WHERE om.deliverystatus != -1`;
        const params = [];

        if (status !== undefined && status !== '') {
            params.push(Number(status));
            query += ` AND om.deliverystatus = $${params.length}`;
        }
        if (dateFrom) {
            params.push(dateFrom);
            query += ` AND om.dateoforder >= $${params.length}`;
        }
        if (dateTo) {
            params.push(dateTo);
            query += ` AND om.dateoforder < ($${params.length}::date + INTERVAL '1 day')`;
        }
        query += ' ORDER BY om.dateoforder DESC';

        const result = await pool.query(query, params);
        const orders = result.rows.map((order) => {
            const paymentSignature = String(order.paymentsignature || '').toLowerCase();
            const isCodOrder = paymentSignature.startsWith('cash-on-delivery') || String(order.paymentid || '').startsWith('COD-');
            const isCodPaid = paymentSignature === 'cash-on-delivery-paid';

            return {
                ...order,
                iscodorder: isCodOrder,
                iscodpaid: isCodPaid,
                paymentstatus: orderService.getPaymentStatus(order),
            };
        });

        const ordersWithProducts = await Promise.all(orders.map(async (order) => {
            const detailsResult = await pool.query(
                'SELECT * FROM orderdetails WHERE invoiceid = $1 AND ordertype = 1',
                [order.invoiceid]
            );
            const products = await Promise.all(detailsResult.rows.map(async (item) => {
                const prodResult = await pool.query(
                    'SELECT name, price, unit, offerprice, privilegeofferprice FROM productdetails WHERE code = $1',
                    [item.productcode]
                );
                const productDetails = prodResult.rows[0];
                // Prefer the price actually paid at order time; fall back to the current
                // product price only for legacy orders placed before this was recorded.
                const paidPrice = (item.price !== null && item.price !== undefined) ? Number(item.price) : Number(productDetails?.price ?? 0);
                // Current catalog (MRP) price used as the reference point to surface any offer applied at purchase time.
                const mrp = Number(productDetails?.price ?? paidPrice);
                const offerPrice = Number(productDetails?.offerprice ?? 0);
                const privilegeOfferPrice = Number(productDetails?.privilegeofferprice ?? 0);

                let offerLabel = null;
                if (order.isprivilegecustomer && privilegeOfferPrice > 0 && paidPrice === privilegeOfferPrice) {
                    offerLabel = 'Privilege Offer';
                } else if (offerPrice > 0 && paidPrice === offerPrice) {
                    offerLabel = 'Special Offer';
                } else if (paidPrice < mrp) {
                    offerLabel = 'Discount Applied';
                }
                const discountAmount = mrp > paidPrice ? mrp - paidPrice : 0;
                const discountPercent = mrp > 0 && discountAmount > 0 ? Math.round((discountAmount / mrp) * 100) : 0;

                return {
                    ...item,
                    productname: productDetails?.name ?? item.productcode,
                    price: paidPrice,
                    unit: productDetails?.unit || null,
                    mrp,
                    offerlabel: offerLabel,
                    discountpercent: discountPercent
                };
            }));
            return { ...order, products };
        }));

        res.status(200).json(ordersWithProducts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/orders/update-status', requireAdmin, async function(req, res) {
    const { invoiceid, status } = req.body;
    if (!invoiceid || status === undefined)
        return res.status(400).send('invoiceid and status are required.');
    if (![0, 1, 2, 3].includes(Number(status)))
        return res.status(400).send('Invalid status value.');

    try {
        const result = await pool.query(
            'UPDATE ordermeta SET deliverystatus = $1 WHERE invoiceid = $2',
            [Number(status), invoiceid]
        );
        if (result.rowCount === 0)
            return res.status(404).send('Order not found.');

        if (Number(status) === 3) {
            // fetch customer email and send delivery confirmation
            const orderRow = await pool.query(
                `SELECT om.invoiceid, ui.name AS username, ui.email AS useremail
                 FROM ordermeta om
                 LEFT JOIN userinfo ui ON ui.id = om.userid
                 WHERE om.invoiceid = $1`,
                [invoiceid]
            );
            if (orderRow.rows.length > 0) {
                const { username, useremail } = orderRow.rows[0];
                try {
                    await sendDeliveryEmail({
                        customerName: username || useremail,
                        customerEmail: useremail,
                        invoiceNumber: invoiceid,
                        supportEmail: process.env.SUPPORT_EMAIL || 'support@amudhootru.com'
                    });
                } catch (emailErr) {
                    console.error('Delivery email failed:', emailErr?.message || emailErr);
                }
            }
        }

        res.status(200).json({ message: 'Order status updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/orders/update-payment-status', requireAdmin, async function(req, res) {
    const { invoiceid, paymentStatus } = req.body;

    if (!invoiceid || !paymentStatus) {
        return res.status(400).send('invoiceid and paymentStatus are required.');
    }

    if (String(paymentStatus).toLowerCase() !== 'paid') {
        return res.status(400).send("paymentStatus must be 'paid'.");
    }

    try {
        const orderResult = await pool.query(
            `SELECT om.paymentid, om.paymentsignature, ui.name AS username, ui.email AS useremail
             FROM ordermeta om
             LEFT JOIN userinfo ui ON ui.id = om.userid
             WHERE om.invoiceid = $1`,
            [invoiceid]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).send('Order not found.');
        }

        const order = orderResult.rows[0];
        const paymentSignature = String(order.paymentsignature || '').toLowerCase();
        const isCodOrder = paymentSignature.startsWith('cash-on-delivery') || String(order.paymentid || '').startsWith('COD-');

        if (!isCodOrder) {
            return res.status(400).send('Manual payment update is allowed only for COD orders.');
        }

        const normalizedStatus = String(paymentStatus).toLowerCase();
        const nextSignature = 'cash-on-delivery-paid';

        await pool.query(
            'UPDATE ordermeta SET paymentsignature = $1 WHERE invoiceid = $2',
            [nextSignature, invoiceid]
        );

        if (order.useremail) {
            try {
                await sendPaymentSuccessEmail({
                    customerName: order.username || order.useremail,
                    customerEmail: order.useremail,
                    invoiceNumber: invoiceid,
                    supportEmail: process.env.SUPPORT_EMAIL || 'support@amudhootru.com'
                });
            } catch (emailErr) {
                console.error('Payment success email failed:', emailErr?.message || emailErr);
            }
        }

        return res.status(200).json({
            message: 'Payment status updated successfully.',
            invoiceid,
            paymentstatus: 'Paid (COD Collected)',
            iscodorder: true,
            iscodpaid: true,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router; 
