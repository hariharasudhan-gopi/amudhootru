const express = require('express');
const { requireAdmin } = require('../middleware/auth');
const pool = require('../db/pool');

const router = express.Router();

router.use(express.json());

function parseJsonIfString(value) {
    if (typeof value !== 'string') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

// Admin: list of regular customers for the Accounts page.
router.get('/admin/users', requireAdmin, async function(req, res) {
    try {
        const result = await pool.query(
            `SELECT id, name, email, phone, address, (profiletype = 2) AS isprivilege
             FROM userinfo
             WHERE profiletype != 1
             ORDER BY name ASC`
        );

        const users = result.rows.map((user) => ({
            ...user,
            address: parseJsonIfString(user.address),
        }));

        res.status(200).json({ users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin: full profile of one customer plus their last 20 orders (with per-product reviews).
router.get('/admin/users/:id', requireAdmin, async function(req, res) {
    const { id } = req.params;

    try {
        const userResult = await pool.query(
            'SELECT id, name, email, phone, address, deliveryaddress, (profiletype = 2) AS isprivilege FROM userinfo WHERE id = $1',
            [id]
        );
        if (userResult.rows.length === 0) return res.status(404).send('User not found.');

        const user = {
            ...userResult.rows[0],
            address: parseJsonIfString(userResult.rows[0].address),
            deliveryaddress: parseJsonIfString(userResult.rows[0].deliveryaddress),
        };

        const ordersResult = await pool.query(
            `SELECT id, deliverystatus, dateoforder, invoiceid, paymentid, paymentsignature
             FROM ordermeta
             WHERE userid = $1 AND deliverystatus != -1 AND invoiceid IS NOT NULL
             ORDER BY dateoforder DESC
             LIMIT 20`,
            [id]
        );

        const orders = await Promise.all(ordersResult.rows.map(async (order) => {
            const itemsResult = await pool.query(
                `SELECT od.productcode, od.quantity, pd.name AS productname, pd.unit,
                        pr.rating, pr.reviewtext
                 FROM orderdetails od
                 JOIN productdetails pd ON pd.code = od.productcode
                 LEFT JOIN productreviews pr
                        ON pr.productcode = od.productcode AND pr.userid = $2 AND pr.invoiceid = od.invoiceid
                 WHERE od.invoiceid = $1 AND od.ordertype = 1`,
                [order.invoiceid, id]
            );

            return { ...order, products: itemsResult.rows };
        }));

        res.status(200).json({ user, orders });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin: mark or unmark a customer as a privilege customer.
router.post('/admin/users/:id/privilege', requireAdmin, async function(req, res) {
    const { id } = req.params;
    const { isPrivilege } = req.body;

    if (typeof isPrivilege !== 'boolean') {
        return res.status(400).send('isPrivilege boolean is required.');
    }

    try {
        const result = await pool.query(
            `UPDATE userinfo SET profiletype = $1
             WHERE id = $2 AND profiletype != 1
             RETURNING id, (profiletype = 2) AS isprivilege`,
            [isPrivilege ? 2 : 0, id]
        );
        if (result.rows.length === 0) return res.status(404).send('User not found.');

        res.status(200).json({ message: 'Privilege status updated.', isprivilege: result.rows[0].isprivilege });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
