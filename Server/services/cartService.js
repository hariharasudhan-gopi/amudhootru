const pool = require('../db/pool');

async function isProductInCart(userId, productCode) {
    const result = await pool.query(
        'SELECT * FROM orderdetails WHERE productcode = $1 and ordertype = $2 and userid = $3',
        [productCode, 0, userId]
    );
    return result.rows.length > 0;
}

async function getCart(userId) {
    const result = await pool.query(
        'SELECT * FROM orderdetails where ordertype = $1 and userid = $2',
        [0, userId]
    );
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

    return products;
}

async function addProductToCart(userId, productCode) {
    const alreadyInCart = await isProductInCart(userId, productCode);
    if (!alreadyInCart) {
        await pool.query(
            'INSERT INTO orderdetails (productcode, userid, ordertype, quantity) VALUES ($1, $2, $3, $4)',
            [productCode, userId, 0, 1]
        );
    }
    return { added: !alreadyInCart };
}

async function setCartQuantity(userId, productCode, quantity) {
    const productResult = await pool.query(
        'SELECT availablequantity FROM productdetails WHERE code = $1',
        [productCode]
    );
    if (productResult.rows.length === 0) {
        const error = new Error('Product not found.');
        error.code = 'PRODUCT_NOT_FOUND';
        throw error;
    }

    const availableQty = Number(productResult.rows[0].availablequantity);
    if (!isNaN(availableQty) && quantity > availableQty) {
        const error = new Error(`Only ${availableQty} unit(s) available in stock.`);
        error.code = 'INSUFFICIENT_STOCK';
        error.availableQty = availableQty;
        throw error;
    }

    const result = await pool.query(
        'UPDATE orderdetails SET quantity = $1 WHERE productcode = $2 AND userid = $3 AND ordertype = 0 RETURNING id',
        [quantity, productCode, userId]
    );
    if (result.rows.length === 0) {
        const error = new Error('Product not found in cart.');
        error.code = 'NOT_IN_CART';
        throw error;
    }

    return { quantity };
}

async function removeFromCart(userId, productCode) {
    await pool.query(
        'DELETE FROM orderdetails WHERE productcode = $1 AND userid = $2 AND ordertype = 0',
        [productCode, userId]
    );
}

module.exports = {
    isProductInCart,
    getCart,
    addProductToCart,
    setCartQuantity,
    removeFromCart,
};
