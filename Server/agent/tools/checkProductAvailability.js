const productService = require('../../services/productService');

module.exports = {
    name: 'checkProductAvailability',
    description: 'Check whether a requested quantity of a product is currently in stock. Always call this before promising a product is available.',
    parameters: {
        type: 'object',
        properties: {
            productCode: { type: 'string' },
            quantity: { type: 'number', description: 'Requested quantity, defaults to 1.' },
        },
        required: ['productCode'],
    },
    async execute(args) {
        const productCode = args?.productCode;
        if (!productCode) return { error: 'productCode is required.' };
        const quantity = Number(args?.quantity) > 0 ? Number(args.quantity) : 1;

        const product = await productService.getProductByCode(productCode);
        if (!product) return { error: `No product found with code ${productCode}.` };

        const availablequantity = Number(product.availablequantity);
        return {
            productCode,
            name: product.name,
            requestedQuantity: quantity,
            availablequantity,
            available: availablequantity >= quantity,
        };
    },
};
