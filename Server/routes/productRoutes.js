const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();
const { requireAuth, requireAdmin } = require('../middleware/auth');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

const router = express.Router();

router.use(express.json());

router.get('/products', async function(req, res) {

    try{

        // const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected');
        // console.log('Server time:', result.rows[0].now);

        const result = await pool.query(
            'SELECT * FROM productdetails',
            []
        );
        console.log('Query result:', result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found'
            });
        }
        const products = result.rows;

        console.log('Products fetched successfully');
        res.status(200);
        res.json({ message: 'Products fetched successfully' ,
            products: products
        });


    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/products/addtocart', requireAuth, async function(req, res) {
    var productCode = req.body.productCode;
    var productName = req.body.productName;
    var userId = req.user.userId;

    try{
        // Here you can implement the logic to add the product to the user's cart in the database.
        // For example, you might have a "cart" table where you insert a new row with the product details.

        console.log(`Adding product to cart: ${productCode} - ${productName}`);

        const result = await pool.query(
            'SELECT * FROM orderdetails WHERE productcode = $1 and ordertype = $2 and userid = $3',
            [productCode, 0, userId]
        );

        console.log('Query result:', result.rows);
        if (result.rows.length === 0) {
            await pool.query(
                'INSERT INTO orderdetails (productcode, userid, ordertype) VALUES ($1, $2, $3)',
                [productCode, userId, 0]
            );
        }

        console.log('Product added to cart successfully');
        
        // Simulate adding to cart (you would replace this with actual database logic)
        // await pool.query('INSERT INTO cart (product_code, product_name) VALUES ($1, $2)', [productCode, productName]);

        res.status(200).json({ message: 'Product added to cart successfully' });

    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }       
});

router.get('/products/getcart', requireAuth, async function(req, res) {

    var userId = req.user.userId;

    try{

        // const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected');
        // console.log('Server time:', result.rows[0].now);

        const result = await pool.query(
            'SELECT * FROM orderdetails where ordertype = $1 and userid = $2',
            [0, userId]
        );
        console.log('Query result:', result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No products found in cart'
            });
        }
        const products = result.rows;

        for (let i = 0; i < products.length; i++) {
            const productCode = products[i].productcode;
            const productResult = await pool.query(
                'SELECT * FROM productdetails where code = $1',
                [productCode]
            );
            if (productResult.rows.length > 0) {
                products[i] = { ...products[i], ...productResult.rows[0] };
            }
        }

        console.log('Products fetched successfully from cart');
        res.status(200);
        res.json({ message: 'Products fetched successfully from cart' ,
            products: products
        });
    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/products/add', requireAdmin, async function(req, res) {
    const { code, name, price, description, quantity, img_src, unit } = req.body;

    if (!code || !name || !price || !description || quantity === undefined) {
        return res.status(400).send('Missing required product fields.');
    }

    try {
        const existing = await pool.query(
            'SELECT code FROM productdetails WHERE code = $1',
            [code]
        );
        if (existing.rows.length > 0) {
            return res.status(409).send('A product with this code already exists.');
        }

        await pool.query(
            'INSERT INTO productdetails (code, name, price, description, availablequantity, img_src, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [code, name, price, description, quantity, img_src || null, unit || null]
        );

        res.status(201).json({ message: 'Product added successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/products/:code', async function(req, res) {
    const { code } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM productdetails WHERE code = $1',
            [code]
        );
        if (result.rows.length === 0)
            return res.status(404).send('Product not found.');
        res.status(200).json({ product: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/products/update', requireAdmin, async function(req, res) {
    const { code, name, price, description, quantity, img_src, unit } = req.body;

    if (!code) return res.status(400).send('Product code is required.');

    try {
        const existing = await pool.query(
            'SELECT code FROM productdetails WHERE code = $1',
            [code]
        );
        if (existing.rows.length === 0)
            return res.status(404).send('Product not found.');

        await pool.query(
            `UPDATE productdetails
             SET name = COALESCE($2, name),
                 price = COALESCE($3, price),
                 description = COALESCE($4, description),
                 availablequantity = COALESCE($5, availablequantity),
                 img_src = COALESCE($6, img_src),
                 unit = COALESCE($7, unit)
             WHERE code = $1`,
            [code, name || null, price || null, description || null,
             quantity !== undefined ? quantity : null, img_src || null, unit || null]
        );

        res.status(200).json({ message: 'Product updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/products/removefromcart', requireAuth, async function(req, res) {
    const { productCode } = req.body;
    const userId = req.user.userId;
    if (!productCode) return res.status(400).send('productCode is required.');
    try {
        await pool.query(
            'DELETE FROM orderdetails WHERE productcode = $1 AND userid = $2 AND ordertype = 0',
            [productCode, userId]
        );
        res.status(200).json({ message: 'Product removed from cart.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
