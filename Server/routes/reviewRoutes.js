const express = require('express');
const { requireAuth } = require('../middleware/auth');
const pool = require('../db/pool');

const router = express.Router();

router.use(express.json());

// Returns the products of the user's most recent placed order along with whether
// any of them still need a review, so the client can decide to show the review popup.
router.get('/reviews/pending', requireAuth, async function(req, res) {
    const userId = req.user.userId;

    try {
        const orderResult = await pool.query(
            `SELECT invoiceid FROM ordermeta
             WHERE userid = $1 AND deliverystatus != -1 AND invoiceid IS NOT NULL
             ORDER BY dateoforder DESC LIMIT 1`,
            [userId]
        );
        if (orderResult.rows.length === 0) {
            return res.status(200).json({ pending: false, products: [] });
        }
        const invoiceId = orderResult.rows[0].invoiceid;

        const itemsResult = await pool.query(
            `SELECT od.productcode, pd.name AS productname, pd.img_src, pd.unit
             FROM orderdetails od
             JOIN productdetails pd ON pd.code = od.productcode
             WHERE od.invoiceid = $1 AND od.ordertype = 1`,
            [invoiceId]
        );
        if (itemsResult.rows.length === 0) {
            return res.status(200).json({ pending: false, products: [] });
        }

        const reviewsResult = await pool.query(
            'SELECT productcode, rating, reviewtext FROM productreviews WHERE userid = $1 AND invoiceid = $2',
            [userId, invoiceId]
        );
        const reviewedMap = new Map(reviewsResult.rows.map((r) => [r.productcode, r]));

        const products = itemsResult.rows.map((item) => {
            const existing = reviewedMap.get(item.productcode);
            return {
                productcode: item.productcode,
                productname: item.productname,
                img_src: item.img_src,
                unit: item.unit,
                rating: existing ? existing.rating : 0,
                reviewtext: existing ? (existing.reviewtext || '') : ''
            };
        });

        const pending = products.some((p) => !p.rating);

        res.status(200).json({ pending, invoiceid: invoiceId, products });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Creates or updates one or more product reviews for an order belonging to the user.
router.post('/reviews/submit', requireAuth, async function(req, res) {
    const userId = req.user.userId;
    const { invoiceid, reviews } = req.body;

    if (!invoiceid || !Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).send('invoiceid and reviews are required.');
    }

    try {
        const orderCheck = await pool.query(
            'SELECT id FROM ordermeta WHERE invoiceid = $1 AND userid = $2',
            [invoiceid, userId]
        );
        if (orderCheck.rows.length === 0) return res.status(404).send('Order not found.');

        for (const review of reviews) {
            const { productcode, rating, reviewtext } = review;
            const ratingValue = Number(rating);
            if (!productcode || !Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                return res.status(400).send('Each review requires a productcode and a rating between 1 and 5.');
            }

            await pool.query(
                `INSERT INTO productreviews (userid, productcode, invoiceid, rating, reviewtext, updatedat)
                 VALUES ($1, $2, $3, $4, $5, NOW())
                 ON CONFLICT (userid, productcode, invoiceid)
                 DO UPDATE SET rating = $4, reviewtext = $5, updatedat = NOW()`,
                [userId, productcode, invoiceid, ratingValue, reviewtext || null]
            );
        }

        res.status(200).json({ message: 'Review saved successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
