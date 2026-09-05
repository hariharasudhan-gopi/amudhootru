const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

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

function toUserDetails(user, cartItemsCount = 0) {
    return {
        userId: user.id,
        username: user.name,
        email: user.email,
        phone: user.phone,
        address: parseJsonIfString(user.address),
        deliveryAddress: parseJsonIfString(user.deliveryaddress),
        isAdminUser: user.profiletype === 1,
        isCartItemsAvailable: cartItemsCount > 0,
        profileimage: user.profileimage || null,
    };
}

router.post('/userLogin', async function(req, res) {
    var usermail = req.body.usermail;
    var password = req.body.password;

    try{

        // const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected');
        // console.log('Server time:', result.rows[0].now);

        const result = await pool.query(
            'SELECT * FROM userInfo WHERE email = $1',
            [usermail]
        );
        console.log('Query result:', result.rows);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        const cartItems = await pool.query(
            'SELECT * FROM orderdetails WHERE userId = $1 and ordertype = $2',
            [user.id, 0]
        );

        const userDetails = toUserDetails(user, cartItems.rows.length);
        req.session.user = userDetails;

        console.log('User authenticated successfully');
        res.status(201);
        res.json({ message: 'Login successful', userDetails });


    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/userInfo', async function(req, res) {
    var username = req.body.username;
    var usermail = req.body.usermail;
    var password = req.body.password;
    var address = req.body.address;
    var phone = req.body.phone;
    var deliveryAddress = req.body.deliveryAddress;

    try{

        // const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected');
        // console.log('Server time:', result.rows[0].now);

        const result = await pool.query(
            'SELECT * FROM userInfo WHERE email = $1',
            [usermail]
        );
        console.log('Query result:', result.rows);
        if (result.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User already exists'
            });
        }
        const user = result.rows[0];

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertResult = await pool.query(
            'INSERT INTO userInfo (name, email, password, address, phone, deliveryaddress, profiletype) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [username, usermail, hashedPassword, JSON.stringify(address), phone, deliveryAddress, 0]
        );
        const newUser = insertResult.rows[0];

        const userDetails = toUserDetails(newUser, 0);
        req.session.user = userDetails;

        console.log('User registered successfully');
        res.status(201);
        res.json({ message: 'Signup successful', userDetails });


    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/userInfo', async function(req, res) {
    var username = req.body.username;
    var usermail = req.body.usermail;
    var phone = req.body.phone;
    var address = req.body.address;
    var profileimage = req.body.profileimage;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.session.user.email !== usermail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try{

        const updateResult = await pool.query(
            'UPDATE userInfo SET name = $1, phone = $2, address = $3, profileimage = COALESCE($4, profileimage) WHERE email = $5 RETURNING *',
            [username, phone, JSON.stringify(address), profileimage || null, usermail]
        );
        const updatedUser = updateResult.rows[0];
        const userDetails = {
            ...toUserDetails(updatedUser, req.session.user.isCartItemsAvailable ? 1 : 0),
            isCartItemsAvailable: req.session.user.isCartItemsAvailable,
        };
        req.session.user = userDetails;

        console.log('User info updated successfully');
        res.status(201);
        res.json({ message: 'User info updated successfully', userDetails });

    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.put('/userInfo/deliveryAddress', async function(req, res) {
    var usermail = req.body.usermail;
    var deliveryAddress = req.body.deliveryAddress;

    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.session.user.email !== usermail) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    try{

        // const result = await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL connected');
        // console.log('Server time:', result.rows[0].now);

        const ExistingUserResult = await pool.query(
            'SELECT * FROM userInfo WHERE email = $1',
            [usermail]
        );
        console.log('Query result:', ExistingUserResult.rows);
        if (ExistingUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const existingUser = ExistingUserResult.rows[0];

        const existingDeliveryAddress = existingUser.deliveryaddress ? JSON.parse(existingUser.deliveryaddress) : [];

        // Append the new address to the existing delivery addresses
        const updatedDeliveryAddress = [...existingDeliveryAddress, deliveryAddress];

        const updateResult = await pool.query(
            'UPDATE userInfo SET deliveryaddress = $1 WHERE email = $2 RETURNING *',
            [JSON.stringify(updatedDeliveryAddress), usermail]
        );
        const updatedUser = updateResult.rows[0];
        const userDetails = {
            ...toUserDetails(updatedUser, req.session.user.isCartItemsAvailable ? 1 : 0),
            isCartItemsAvailable: req.session.user.isCartItemsAvailable,
        };
        req.session.user = userDetails;

        console.log('Delivery address updated successfully');
        res.status(201);
        res.json({ message: 'Delivery address updated successfully', userDetails });

    }catch(err){
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/auth/session', async function(req, res) {
    if (!req.session || !req.session.user) {
        return res.status(200).json({ isLoggedIn: false, userDetails: null });
    }

    try {
        const userId = req.session.user.userId;
        const [userResult, cartItems] = await Promise.all([
            pool.query('SELECT * FROM userInfo WHERE id = $1', [userId]),
            pool.query('SELECT * FROM orderdetails WHERE userId = $1 and ordertype = $2', [userId, 0]),
        ]);

        if (userResult.rows.length === 0) {
            req.session.destroy(() => {});
            return res.status(200).json({ isLoggedIn: false, userDetails: null });
        }

        const userDetails = toUserDetails(userResult.rows[0], cartItems.rows.length);
        req.session.user = userDetails;

        return res.status(200).json({ isLoggedIn: true, userDetails });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }
});

router.post('/auth/logout', function(req, res) {
    if (!req.session) {
        return res.status(200).json({ message: 'Logged out' });
    }

    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        res.clearCookie('amudhootru.sid');
        return res.status(200).json({ message: 'Logged out' });
    });
});

module.exports = router;
