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

// Step 1: Create a Razorpay order and return order_id to the client
router.post('/orders/create-payment', requireAuth, async function(req, res) {
    const { products } = req.body;

    try {
        let productsPrice = 0;

        for (const product of products) {
            const productResult = await pool.query(
                'SELECT * FROM productdetails WHERE code = $1',
                [product.productId]
            );

            if (productResult.rows.length === 0) {
                return res.status(404).json({ message: `Product with ID ${product.productId} not found` });
            }

            const productDetails = productResult.rows[0];
            const effectivePrice = productDetails.offerprice && Number(productDetails.offerprice) > 0
                ? Number(productDetails.offerprice)
                : Number(productDetails.price);
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

        // Payment is verified — save the order
        const orderDate = new Date();

        const orderResult = await pool.query(
            'INSERT INTO ordermeta (userid, deliverystatus, deliveryaddress, dateoforder, paymentid, paymentsignature) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [userId, 0, deliveryAddress, orderDate, savedPaymentId, savedPaymentSignature]
        );

        const orderId = orderResult.rows[0].id;

        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(orderId).padStart(6, "0")}`;

        await pool.query(
            'UPDATE ordermeta SET invoiceid = $1 WHERE id = $2',
            [invoiceNumber, orderId]
        );

        for (const product of products) {
            await pool.query(
                'INSERT INTO orderdetails (productcode, userid, quantity, ordertype, invoiceid) VALUES ($1, $2, $3, $4, $5)',
                [product.productId, userId, product.quantity, 1, invoiceNumber]
            );
            // decrement stock; floor at 0 to prevent negative values
            await pool.query(
                'UPDATE productdetails SET availablequantity = GREATEST(availablequantity - $1, 0) WHERE code = $2',
                [product.quantity || 1, product.productId]
            );
        }

        await pool.query(
            'DELETE FROM orderdetails WHERE userid = $1 AND ordertype = $2',
            [userId, 0]
        );

        // await transporter.sendMail(mailOptions);
        await sendInvoiceEmail({
            customerName: usermail,
            customerEmail: usermail,
            products: products.map(product => ({
                name: product.name,
                quantity: product.quantity || 1,
                price: product.price * (product.quantity || 1)
            })),
            invoiceNumber,
            orderDate: new Date(),
            paymentStatus: selectedPaymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid',
            subtotal: products.reduce((sum, product) => sum + product.price * (product.quantity || 1), 0),
            tax: 0,
            shipping: 0,
            grandTotal: products.reduce((sum, product) => sum + product.price * (product.quantity || 1), 0),
            supportEmail: process.env.SUPPORT_EMAIL || 'support@amudhootru.com'
        });

        res.status(200).json({
            message: selectedPaymentMethod === 'cod'
                ? 'Order placed successfully with Cash on Delivery'
                : 'Order placed successfully',
            orderId: orderId
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/orders/placed', requireAuth, async function(req, res) {
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'SELECT * FROM ordermeta WHERE userid = $1',
            [userId]
        );

        const orders = result.rows;
        for (var i = 0; i < orders.length; i++) {
            const paymentSignature = String(orders[i].paymentsignature || '').toLowerCase();
            orders[i].iscodorder = paymentSignature.startsWith('cash-on-delivery') || String(orders[i].paymentid || '').startsWith('COD-');
            orders[i].iscodpaid = paymentSignature === 'cash-on-delivery-paid';
            orders[i].paymentstatus = getPaymentStatus(orders[i]);

            if(orders[i].deliverystatus === 0){
                orders[i].deliverystatus = "Order Placed";
            }else if(orders[i].deliverystatus === 1){
                orders[i].deliverystatus = "Order Shipped";
            }else if(orders[i].deliverystatus === 2){
                orders[i].deliverystatus = "Out for Delivery";
            }else if(orders[i].deliverystatus === 3){
                orders[i].deliverystatus = "Delivered";
            }
        }

        const orderDetailsPromises = orders.map(async (order) => {
            const orderDetailsResult = await pool.query(
                'SELECT * FROM orderdetails WHERE invoiceid = $1',
                [order.invoiceid]
            );

            return {
                ...order,
                products: orderDetailsResult.rows
            };
        });

        const ordersWithDetails = await Promise.all(orderDetailsPromises);

        const productDetailsPromises = ordersWithDetails.map(async (order) => {
            const productPromises = order.products.map(async (product) => {
                const productResult = await pool.query(
                    'SELECT * FROM productdetails WHERE code = $1',
                    [product.productcode]
                );

                return {
                    ...product,
                    productname: productResult.rows[0].name,
                    price: productResult.rows[0].price,
                    unit: productResult.rows[0].unit || null
                };
            });

            const productsWithDetails = await Promise.all(productPromises);

            return {
                ...order,
                products: productsWithDetails
            };
        });

        const ordersWithProductDetails = await Promise.all(productDetailsPromises); 

        res.status(200).json(ordersWithProductDetails);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/orders/all', requireAdmin, async function(req, res) {
    const { status, dateFrom, dateTo } = req.query;

    try {
        let query = `SELECT om.*, ui.name AS username, ui.email AS useremail
                     FROM ordermeta om
                     LEFT JOIN userinfo ui ON ui.id = om.userid
                     WHERE 1=1`;
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
                paymentstatus: getPaymentStatus(order),
            };
        });

        const ordersWithProducts = await Promise.all(orders.map(async (order) => {
            const detailsResult = await pool.query(
                'SELECT * FROM orderdetails WHERE invoiceid = $1 AND ordertype = 1',
                [order.invoiceid]
            );
            const products = await Promise.all(detailsResult.rows.map(async (item) => {
                const prodResult = await pool.query(
                    'SELECT name, price, unit FROM productdetails WHERE code = $1',
                    [item.productcode]
                );
                return {
                    ...item,
                    productname: prodResult.rows[0]?.name ?? item.productcode,
                    price: prodResult.rows[0]?.price ?? 0,
                    unit: prodResult.rows[0]?.unit || null
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
