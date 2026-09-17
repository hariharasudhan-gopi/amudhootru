const productService = require('../../services/productService');

module.exports = {
    name: 'searchProduct',
    description: 'Search for products by name or keyword (e.g. "groundnut oil", "honey"). Returns matching products with their product code, price, unit, and available quantity.',
    parameters: {
        type: 'object',
        properties: {
            query: { type: 'string', description: 'Product name or keyword to search for.' },
        },
        required: ['query'],
    },
    async execute(args) {
        const query = String(args?.query || '').trim();
        if (!query) return { error: 'A search query is required.' };

        const products = await productService.searchProductsByName(query);
        return {
            products: products.map((product) => ({
                productCode: product.code,
                name: product.name,
                price: Number(product.price),
                unit: product.unit,
                availablequantity: product.availablequantity,
            })),
        };
    },
};
