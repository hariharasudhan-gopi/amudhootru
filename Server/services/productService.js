const pool = require('../db/pool');

async function getAllProductsWithRatings() {
    const result = await pool.query(
        `SELECT p.*,
                COALESCE(r.avgrating, 0) AS avgrating,
                COALESCE(r.reviewcount, 0) AS reviewcount
         FROM productdetails p
         LEFT JOIN (
             SELECT productcode, AVG(rating) AS avgrating, COUNT(*) AS reviewcount
             FROM productreviews
             GROUP BY productcode
         ) r ON r.productcode = p.code`,
        []
    );
    return result.rows;
}

async function getProductByCode(code) {
    const result = await pool.query('SELECT * FROM productdetails WHERE code = $1', [code]);
    return result.rows[0] || null;
}

// Used by the AI agent's searchProduct tool; no server-side product search existed before.
async function searchProductsByName(query) {
    const result = await pool.query(
        'SELECT * FROM productdetails WHERE name ILIKE $1 ORDER BY name LIMIT 10',
        [`%${query}%`]
    );
    return result.rows;
}

module.exports = {
    getAllProductsWithRatings,
    getProductByCode,
    searchProductsByName,
};
